/**
 * Example usage of the ChatBox component
 * 
 * This file demonstrates how to use the ChatBox component in your application.
 */

import { ChatBox } from "../index";

// Basic usage
export function BasicChatBox() {
  return (
    <ChatBox
      apiEndpoint="/api/chat"
      title="AI Assistant"
      placeholder="Ask me anything..."
    />
  );
}

// With custom configuration
export function CustomChatBox() {
  return (
    <ChatBox
      apiEndpoint="/api/chat"
      title="Customer Support"
      placeholder="How can I help you?"
      maxHeight="700px"
      showTitle={true}
      headers={{
        Authorization: "Bearer your-token-here",
      }}
      className="shadow-lg"
    />
  );
}

// With custom styling
export function StyledChatBox() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <ChatBox
        apiEndpoint="/api/chat"
        title="AI Chat"
        maxHeight="600px"
        className="border-2 border-primary"
      />
    </div>
  );
}
