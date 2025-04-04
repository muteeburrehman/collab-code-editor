'use client'

import { useEffect, useRef, useState } from 'react'
import autobahn from 'autobahn-browser'


// Import CodeMirror v6 modules
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentUnit } from '@codemirror/language'
import { closeBrackets, autocompletion } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { searchKeymap } from '@codemirror/search'

// Language support imports
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp' // For C and C++
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'

const CollaborativeEditor = ({
  documentId,
  initialContent = '',
  language = 'javascript',
  userId,
  username,
  token,
  onUserJoined,
  onUserLeft
}) => {
  const editorRef = useRef(null)
  const editorView = useRef(null)
  const wampSession = useRef(null)
  const wampConnection = useRef(null)
  const editorContentRef = useRef(initialContent)
  const [isConnected, setIsConnected] = useState(false)
  const [isApplyingRemoteChanges, setIsApplyingRemoteChanges] = useState(false)
  const cursorMarkers = useRef({})
  // Add ref to store subscription objects
  const subscriptions = useRef([])

  // Map language to CodeMirror language support
  const getLanguageSupport = (lang) => {
    const langMap = {
      javascript: javascript(),
      typescript: javascript({ typescript: true }),
      jsx: javascript({ jsx: true }),
      tsx: javascript({ jsx: true, typescript: true }),
      python: python(),
      java: java(),
      cpp: cpp(),
      csharp: cpp(), // Use C++ highlighting for C# as an approximation
      php: php(),
      rust: rust(),
      html: html(),
      css: css()
      // For other languages without direct support, we fall back to javascript
    }
    return langMap[lang.toLowerCase()] || javascript()
  }

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return

    // Create a CodeMirror state
    const startState = EditorState.create({
      doc: initialContent,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...commentKeymap,
          ...searchKeymap
        ]),
        indentUnit.of("  "),
        getLanguageSupport(language),
        EditorView.updateListener.of(update => {
          if (update.docChanged && !isApplyingRemoteChanges) {
            editorContentRef.current = update.state.doc.toString()
            handleEditorChanges(update)
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" }
        })
      ]
    })

    // Create the editor view
    editorView.current = new EditorView({
      state: startState,
      parent: editorRef.current
    })

    // Focus the editor
    setTimeout(() => {
      editorView.current.focus()
    }, 100)

    return () => {
      if (editorView.current) {
        editorView.current.destroy()
      }
    }
  }, [initialContent, language, isApplyingRemoteChanges])

  // Connect to WAMP router
  useEffect(() => {
    if (!userId || !documentId) return

    const connectToWamp = () => {
      const connection = new autobahn.Connection({
        url: process.env.NEXT_PUBLIC_WAMP_URL || 'ws://localhost:8080/ws',
        realm: process.env.NEXT_PUBLIC_WAMP_REALM || 'realm1'
      })

      connection.onopen = async (session) => {
        console.log('Connected to WAMP router')
        wampSession.current = session
        setIsConnected(true)

        // Announce user presence
        session.publish('code.user.joined', [documentId, {
          id: userId,
          username: username
        }])

        try {
          // Subscribe to document updates and store the subscription objects
          const docSubscription = await session.subscribe(
            `code.document.${documentId}.changed`,
            handleDocumentUpdate
          )

          const cursorSubscription = await session.subscribe(
            `code.cursor.${documentId}.moved`,
            handleCursorUpdate
          )

          const userJoinedSubscription = await session.subscribe(
            `code.user.joined`,
            handleUserJoined
          )

          const userLeftSubscription = await session.subscribe(
            `code.user.left`,
            handleUserLeft
          )

          // Store all subscription objects for cleanup
          subscriptions.current = [
            docSubscription,
            cursorSubscription,
            userJoinedSubscription,
            userLeftSubscription
          ]

          // Set up cursor activity tracking
          if (editorView.current) {
            setupCursorTracking()
          }

          // Setup ping interval to keep connection alive
          const pingInterval = setInterval(() => {
            if (session && session.isOpen) {
              session.publish('code.ping', [documentId, {
                userId,
                timestamp: Date.now()
              }])
            }
          }, 30000) // Every 30 seconds

          return () => clearInterval(pingInterval)
        } catch (error) {
          console.error("Error subscribing to topics:", error)
        }
      }

      connection.onclose = (reason, details) => {
        console.log('Connection closed:', reason, details)
        setIsConnected(false)

        // Notify other users that this user left
        if (wampSession.current && wampSession.current.isOpen) {
          wampSession.current.publish('code.user.left', [documentId, {
            id: userId,
            username: username
          }])
        }

        // Clear subscriptions
        subscriptions.current = []

        // Attempt reconnection
        setTimeout(connectToWamp, 5000)
      }

      connection.open()
      wampConnection.current = connection
    }

    connectToWamp()

    return () => {
      // Clean up subscriptions using the saved subscription objects
      if (subscriptions.current.length > 0) {
        subscriptions.current.forEach(subscription => {
          try {
            if (wampSession.current && wampSession.current.isOpen) {
              wampSession.current.unsubscribe(subscription)
            }
          } catch (error) {
            console.error("Error unsubscribing:", error)
          }
        })
      }

      // Notify about leaving
      if (wampSession.current && wampSession.current.isOpen) {
        wampSession.current.publish('code.user.left', [documentId, {
          id: userId,
          username: username
        }])
      }

      if (wampConnection.current) {
        wampConnection.current.close()
      }
    }
  }, [documentId, userId, username])

  // Setup cursor tracking extension
  const setupCursorTracking = () => {
    // This is a simplified version - in a real app you'd want to debounce this
    editorView.current.dom.addEventListener('mouseup', handleCursorActivity)
    editorView.current.dom.addEventListener('keyup', handleCursorActivity)

    return () => {
      editorView.current.dom.removeEventListener('mouseup', handleCursorActivity)
      editorView.current.dom.removeEventListener('keyup', handleCursorActivity)
    }
  }

  // Handle document updates from other users
  const handleDocumentUpdate = (args) => {
    const [docId, changes, senderId] = args
    if (docId !== documentId || senderId === userId || !editorView.current) return

    setIsApplyingRemoteChanges(true)
    try {
      // Apply remote changes
      // This is a simplified approach - in a real app, you'd need to transform the changes
      // based on your specific change format
      const transaction = editorView.current.state.update({
        changes: {
          from: changes.from || 0,
          to: changes.to || 0,
          insert: changes.text || ""
        }
      })
      editorView.current.dispatch(transaction)
      editorContentRef.current = editorView.current.state.doc.toString()
    } finally {
      setIsApplyingRemoteChanges(false)
    }
  }

  // Handle cursor updates from other users
  const handleCursorUpdate = (args) => {
    const [docId, cursorPos, senderId, senderName] = args
    if (docId !== documentId || senderId === userId || !editorView.current) return

    // This would need a proper implementation to show remote cursors
    // CodeMirror 6 requires an extension for this, simplified version shown here
    console.log(`User ${senderName} moved cursor to position`, cursorPos)
  }

  // Handle user joined notifications
  const handleUserJoined = (args) => {
    const [docId, user] = args
    if (docId !== documentId || user.id === userId) return

    onUserJoined?.(user)
  }

  // Handle user left notifications
  const handleUserLeft = (args) => {
    const [docId, user] = args
    if (docId !== documentId || user.id === userId) return

    // Remove their cursor marker if you implement them
    onUserLeft?.(user)
  }

  // Handle local editor changes
  const handleEditorChanges = (update) => {
    if (isApplyingRemoteChanges || !wampSession.current || !isConnected) return

    // Get the changes from the transaction
    // This is simplified - in a production app, you'd want to send minimal diffs
    const changes = {
      text: update.state.doc.toString(),
      from: 0,
      to: 0
    }

    // Send changes to server
    wampSession.current.publish(`code.document.${documentId}.changed`, [
      documentId,
      changes,
      userId
    ])
  }

  // Handle local cursor movement
  const handleCursorActivity = () => {
    if (!wampSession.current || !isConnected || !editorView.current) return

    // Get current cursor position
    const cursorPos = editorView.current.state.selection.main.head

    wampSession.current.publish(`code.cursor.${documentId}.moved`, [
      documentId,
      cursorPos,
      userId,
      username
    ])
  }

  // Helper function to generate color from user ID
  const stringToColor = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF
      color += ('00' + value.toString(16)).substr(-2)
    }
    return color
  }

  return (
    <div className="relative h-full w-full">
      <div ref={editorRef} className="h-full" />

      {/* Connection status indicator */}
      <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
    </div>
  )
}

export default CollaborativeEditor