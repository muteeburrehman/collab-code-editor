'use client'

import { useEffect, useRef, useState } from 'react'
import autobahn from 'autobahn-browser'
import '@/styles/globals.css';
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
import CollaboratorsList from "@/app/components/CollaboratorsList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const [isSaving, setIsSaving] = useState(false)
  const cursorMarkers = useRef({})
  // Add ref to store subscription objects
  const subscriptions = useRef([])
  // Add state to keep track of when content was last saved
  const lastSaved = useRef(Date.now())
  const hasPendingChanges = useRef(false)
  const saveTimeoutRef = useRef(null)
  const [activeCollaborators, setActiveCollaborators] = useState([])
  const activeUsers = useRef(new Set())

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

  // Fetch the latest document content from server
  const fetchDocumentContent = async () => {
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const document = await response.json();
        setIsApplyingRemoteChanges(true);
        try {
          if (editorView.current) {
            const transaction = editorView.current.state.update({
              changes: {
                from: 0,
                to: editorView.current.state.doc.length,
                insert: document.content || ""
              }
            });
            editorView.current.dispatch(transaction);
            editorContentRef.current = document.content || "";
            hasPendingChanges.current = false;
          }
        } finally {
          setIsApplyingRemoteChanges(false);
        }
      } else {
        console.log('Failed to fetch document:', await response.text());
      }
    } catch (error) {
      console.log('Error fetching document:', error);
    }
  };

  // Force immediate save
  const forceSave = async () => {
    if (hasPendingChanges.current) {
      await saveDocumentToServer();
      return true;
    }
    return false;
  };

  // Save document content to server
  const saveDocumentToServer = async () => {
    if (!hasPendingChanges.current) return;

    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editorContentRef.current
        })
      });

      if (response.ok) {
        lastSaved.current = Date.now();
        hasPendingChanges.current = false;
        console.log('Document saved successfully');
      } else {
        console.log('Failed to save document:', await response.text());
        // Schedule retry
        saveTimeoutRef.current = setTimeout(saveDocumentToServer, 5000);
      }
    } catch (error) {
      console.log('Error saving document:', error);
      // Schedule retry
      saveTimeoutRef.current = setTimeout(saveDocumentToServer, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save function
  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocumentToServer();
    }, 1000); // 1 second delay
  };

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
            const newContent = update.state.doc.toString();
            // Only mark as changed if content actually changed
            if (newContent !== editorContentRef.current) {
              editorContentRef.current = newContent;
              hasPendingChanges.current = true;
              handleEditorChanges(update);
              // Trigger debounced save
              debouncedSave();
            }
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" }
        })
      ]
    });

    // Create the editor view
    editorView.current = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    // Focus the editor
    setTimeout(() => {
      editorView.current.focus();
    }, 100);

    return () => {
      if (editorView.current) {
        editorView.current.destroy();
      }

      // Clean up any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [initialContent, language, isApplyingRemoteChanges]);

  // Handle beforeunload event to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasPendingChanges.current) {
        // This will prompt "Are you sure you want to leave?"
        e.preventDefault();
        e.returnValue = '';

        // Attempt a quick save
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Connect to WAMP router
  useEffect(() => {
    if (!userId || !documentId) return;

    const connectToWamp = () => {
      const connection = new autobahn.Connection({
        url: process.env.NEXT_PUBLIC_WAMP_URL || 'ws://localhost:8080/ws',
        realm: process.env.NEXT_PUBLIC_WAMP_REALM || 'realm1'
      });

      connection.onopen = async (session) => {
        console.log('Connected to WAMP router');
        wampSession.current = session;
        setIsConnected(true);

        // Fetch the latest document content first
        await fetchDocumentContent();

        // Announce user presence
        session.publish('code.user.joined', [documentId, {
          id: userId,
          username: username
        }]);

        try {
          // Subscribe to document updates and store the subscription objects
          const docSubscription = await session.subscribe(
            `code.document.${documentId}.changed`,
            handleDocumentUpdate
          );

          const cursorSubscription = await session.subscribe(
            `code.cursor.${documentId}.moved`,
            handleCursorUpdate
          );

          const userJoinedSubscription = await session.subscribe(
            `code.user.joined`,
            handleUserJoined
          );

          const userLeftSubscription = await session.subscribe(
            `code.user.left`,
            handleUserLeft
          );

          // Store all subscription objects for cleanup
          subscriptions.current = [
            docSubscription,
            cursorSubscription,
            userJoinedSubscription,
            userLeftSubscription
          ];

          // Set up cursor activity tracking
          if (editorView.current) {
            setupCursorTracking();
          }

          // Setup ping interval to keep connection alive
          const pingInterval = setInterval(() => {
            if (session && session.isOpen) {
              session.publish('code.ping', [documentId, {
                userId,
                timestamp: Date.now()
              }]);
            }
          }, 30000); // Every 30 seconds

          return () => clearInterval(pingInterval);
        } catch (error) {
          console.log("Error subscribing to topics:", error);
        }
      };

      connection.onclose = (reason, details) => {
        console.log('Connection closed:', reason, details);
        setIsConnected(false);

        // Notify other users that this user left
        if (wampSession.current && wampSession.current.isOpen) {
          wampSession.current.publish('code.user.left', [documentId, {
            id: userId,
            username: username
          }]);
        }

        // Clear subscriptions
        subscriptions.current = [];

        // Force save before disconnection
        if (hasPendingChanges.current) {
          forceSave();
        }

        // Attempt reconnection
        setTimeout(connectToWamp, 5000);
      };

      connection.open();
      wampConnection.current = connection;
    };

    connectToWamp();

    return () => {
      // Clean up subscriptions using the saved subscription objects
      if (subscriptions.current.length > 0) {
        subscriptions.current.forEach(subscription => {
          try {
            if (wampSession.current && wampSession.current.isOpen) {
              wampSession.current.unsubscribe(subscription);
            }
          } catch (error) {
            console.log("Error unsubscribing:", error);
          }
        });
      }

      // Save any pending changes before unmounting
      if (hasPendingChanges.current) {
        forceSave();
      }

      // Notify about leaving
      if (wampSession.current && wampSession.current.isOpen) {
        wampSession.current.publish('code.user.left', [documentId, {
          id: userId,
          username: username
        }]);
      }

      if (wampConnection.current) {
        wampConnection.current.close();
      }
    };
  }, [documentId, userId, username, token]);

  // Auto-save document periodically
  useEffect(() => {
    if (!documentId || !isConnected || !token) return;

    const saveInterval = setInterval(() => {
      if (hasPendingChanges.current) {
        saveDocumentToServer();
      }
    }, 10000); // Save every 10 seconds if there are changes

    return () => clearInterval(saveInterval);
  }, [documentId, isConnected, token]);

  // Setup cursor tracking extension
  const setupCursorTracking = () => {
    // This is a simplified version - in a real app you'd want to debounce this
    editorView.current.dom.addEventListener('mouseup', handleCursorActivity);
    editorView.current.dom.addEventListener('keyup', handleCursorActivity);

    return () => {
      if (editorView.current) {
        editorView.current.dom.removeEventListener('mouseup', handleCursorActivity);
        editorView.current.dom.removeEventListener('keyup', handleCursorActivity);
      }
    };
  };

  // Handle document updates from other users
  const handleDocumentUpdate = (args) => {
    const [docId, changes, senderId] = args;
    if (docId !== documentId || senderId === userId || !editorView.current) return;

    setIsApplyingRemoteChanges(true);
    try {
      // Check if we receive a full text update or incremental changes
      if (changes.fullText) {
        // Full text update
        const transaction = editorView.current.state.update({
          changes: {
            from: 0,
            to: editorView.current.state.doc.length,
            insert: changes.text || ""
          }
        });
        editorView.current.dispatch(transaction);
      } else if (changes.changes && Array.isArray(changes.changes)) {
        // Apply each change in sequence
        const changeSet = changes.changes.map(change => ({
          from: change.from || 0,
          to: change.to || 0,
          insert: change.text || ""
        }));

        const transaction = editorView.current.state.update({
          changes: changeSet
        });
        editorView.current.dispatch(transaction);
      } else {
        // Legacy format - single change
        const transaction = editorView.current.state.update({
          changes: {
            from: changes.from || 0,
            to: changes.to || 0,
            insert: changes.text || ""
          }
        });
        editorView.current.dispatch(transaction);
      }

      editorContentRef.current = editorView.current.state.doc.toString();
      // Mark that we have changes to save
      hasPendingChanges.current = true;
      // Trigger debounced save
      debouncedSave();
    } finally {
      setIsApplyingRemoteChanges(false);
    }
  };

  // Handle cursor updates from other users
  const handleCursorUpdate = (args) => {
    const [docId, cursorPos, senderId, senderName] = args;
    if (docId !== documentId || senderId === userId || !editorView.current) return;

    // This would need a proper implementation to show remote cursors
    // CodeMirror 6 requires an extension for this, simplified version shown here
    console.log(`User ${senderName} moved cursor to position`, cursorPos);

    // Track active users
    activeUsers.current.add(senderId);

    // Update active collaborators state for UI display
    const updatedCollaborators = Array.from(activeUsers.current).map(id => ({
      id,
      username: id === senderId ? senderName : "Unknown" // In a real app, you'd maintain a mapping
    }));

    setActiveCollaborators(updatedCollaborators);

    // In a full implementation, you'd add visual markers for other users' cursors
  };

  // Handle user joined notifications
  const handleUserJoined = (args) => {
    const [docId, user] = args;
    if (docId !== documentId || user.id === userId) return;

    console.log(`User ${user.username} joined`);
    activeUsers.current.add(user.id);

    // Update UI with new collaborator
    setActiveCollaborators(prev => {
      // Check if user already exists
      if (!prev.some(u => u.id === user.id)) {
        return [...prev, user];
      }
      return prev;
    });

    onUserJoined?.(user);

    // When a user joins, broadcast the current document content to them
    if (wampSession.current && isConnected) {
      wampSession.current.publish(`code.document.${documentId}.changed`, [
        documentId,
        {
          text: editorContentRef.current,
          fullText: true
        },
        userId
      ]);
    }
  };

  // Handle user left notifications
  const handleUserLeft = (args) => {
    const [docId, user] = args;
    if (docId !== documentId || user.id === userId) return;

    console.log(`User ${user.username} left`);
    activeUsers.current.delete(user.id);

    // Update UI by removing collaborator
    setActiveCollaborators(prev => prev.filter(u => u.id !== user.id));

    // Remove their cursor marker if you implement them
    onUserLeft?.(user);
  };

  // Handle local editor changes
  const handleEditorChanges = (update) => {
    if (isApplyingRemoteChanges || !wampSession.current || !isConnected) return;

    // Extract specific changes from the update
    let changes = [];
    update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
      changes.push({
        from: fromA,
        to: toA,
        text: text.toString()
      });
    });

    // Send changes to server if we have any
    if (changes.length > 0) {
      wampSession.current.publish(`code.document.${documentId}.changed`, [
        documentId,
        {
          changes: changes
        },
        userId
      ]);
    }
  };

  // Handle local cursor movement
  const handleCursorActivity = () => {
    if (!wampSession.current || !isConnected || !editorView.current) return;

    // Get current cursor position
    const cursorPos = editorView.current.state.selection.main.head;

    wampSession.current.publish(`code.cursor.${documentId}.moved`, [
      documentId,
      cursorPos,
      userId,
      username
    ]);
  };

  // Helper function to generate color from user ID
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save on Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocumentToServer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={editorRef} className="h-full" />

      {/* Status bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 px-3 py-2 flex items-center justify-between">
        {/* Left side: connection and save status */}
        <div className="flex items-center space-x-4">
          {/* Connection status indicator */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-xs text-gray-700">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          {/* Save status indicator */}
          <div className="flex items-center">
            <span className={`text-xs ${
              isSaving ? 'text-amber-600' : 
              (hasPendingChanges.current ? 'text-amber-600' : 'text-emerald-600')
            }`}>
              {isSaving ? 'Saving...' : (hasPendingChanges.current ? 'Unsaved changes' : 'All changes saved')}
            </span>
          </div>
        </div>

        {/* Right side: active users count and collaborators list */}
        <div className="flex items-center space-x-4">
          {/* Active users count */}
          <div className="text-xs text-gray-700">
            {activeCollaborators.length} other user(s) active
          </div>

          {/* Display collaborators avatars if any */}
          {activeCollaborators.length > 0 && (
            <CollaboratorsList
              collaborators={activeCollaborators}
              currentUserId={userId}
            />
          )}
        </div>
      </div>

      {/* Manual save button */}
      <button
        onClick={saveDocumentToServer}
        disabled={isSaving || !hasPendingChanges.current}
        className={`absolute top-2 right-2 py-1 px-3 text-sm rounded ${
          isSaving || !hasPendingChanges.current 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            :  'bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-200'
        }`}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>


    </div>
  );
};

export default CollaborativeEditor;