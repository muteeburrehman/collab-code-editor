from autobahn.asyncio.wamp import ApplicationRunner, ApplicationSession
from autobahn.wamp.types import SubscribeOptions
from .config import WAMP_URL, WAMP_REALM


class CollabCodeEditorComponent(ApplicationSession):
    async def onJoin(self, details):
        print("Connected to WAMP Router")

        # Subscribe to document updates with pattern matching
        await self.subscribe(
            self.on_document_update,
            "code.document.update",
            options=SubscribeOptions(match="wildcard")
        )

        # Subscribe to cursor position updates
        await self.subscribe(
            self.on_cursor_update,
            "code.cursor.update",
            options=SubscribeOptions(match="wildcard")
        )

        # Register procedure for getting document content
        await self.register(self.get_document_content, "code.document.get")

        print("Subscriptions and registrations complete")

    async def on_document_update(self, document_id, change_data):
        """
        Handle document updates from clients

        change_data should contain:
        - user_id: ID of the user making the change
        - operation: "insert" or "delete"
        - position: {line, ch} where the change occurred
        - text: text being inserted (or deleted)
        """
        print(f"Document {document_id} updated: {change_data}")

        # Broadcast the change to all other users viewing this document
        # Exclude the sender to avoid echo
        await self.publish(
            f"code.document.{document_id}.changed",
            change_data,
            exclude_me=False  # Set to True in production to exclude sender
        )

    async def on_cursor_update(self, document_id, cursor_data):
        """
        Handle cursor position updates from clients

        cursor_data should contain:
        - user_id: ID of the user whose cursor moved
        - position: {line, ch} current cursor position
        - username: Name to display by the cursor
        """
        print(f"Cursor update in document {document_id}: {cursor_data}")

        # Broadcast cursor position to all other users
        await self.publish(
            f"code.cursor.{document_id}.moved",
            cursor_data,
            exclude_me=True  # Don't send back to the same user
        )

    async def get_document_content(self, document_id):
        """
        Return the current content of a document
        In a real implementation, this would fetch from your database
        """
        # This is a placeholder - you would implement actual DB access
        print(f"Document {document_id} content requested")
        return {"status": "success", "message": "Document content would be returned here"}


def run_wamp_component():
    runner = ApplicationRunner(WAMP_URL, WAMP_REALM)
    runner.run(CollabCodeEditorComponent)


if __name__ == '__main__':
    run_wamp_component()