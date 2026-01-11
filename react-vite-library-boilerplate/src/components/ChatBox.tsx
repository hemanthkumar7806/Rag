import React, { useMemo } from "react";
import { 
  AssistantRuntimeProvider, 
  ThreadPrimitive, 
  MessagePrimitive, 
  ComposerPrimitive,
  MessagePartPrimitive
} from "@assistant-ui/react";
import { useDataStreamRuntime } from "@assistant-ui/react-data-stream";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";
import { createFetchInterceptor } from "../lib/data-stream-adapter";
import "./ChatBox.css";

export interface ChatBoxProps {
  /**
   * API endpoint URL for the chat completion
   */
  apiEndpoint: string;
  
  /**
   * Additional headers to send with the request
   */
  headers?: Record<string, string>;
  
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
  
  /**
   * Title of the chat box
   */
  title?: string;
  
  /**
   * Whether to show the title
   */
  showTitle?: boolean;
  
  /**
   * Maximum height of the chat container
   */
  maxHeight?: string;
  
  /**
   * Force dark mode. If not provided, defaults to light mode (white with green)
   */
  darkMode?: boolean;
  
  /**
   * Custom system message
   */
  systemMessage?: string;
}

// User message component
const UserMessage = () => {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-end">
      <MessagePrimitive.Parts
        components={{
          Text: () => (
            <div className="rounded-lg px-4 py-2 max-w-[80%] text-sm bg-primary text-primary-foreground">
              <MessagePartPrimitive.Text component="div" className="whitespace-pre-wrap" />
            </div>
          ),
        }}
      />
    </MessagePrimitive.Root>
  );
};

// Assistant message component with markdown support
const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-start">
      <MessagePrimitive.Parts
        components={{
          Text: () => (
            <div className="rounded-lg px-4 py-2 max-w-[80%] text-sm bg-muted text-muted-foreground">
              <MarkdownTextPrimitive />
            </div>
          ),
        }}
      />
    </MessagePrimitive.Root>
  );
};

export const ChatBox: React.FC<ChatBoxProps> = ({
  apiEndpoint,
  headers = {},
  className,
  placeholder = "Type your message...",
  title = "AI Chat",
  showTitle = true,
  maxHeight = "600px",
  darkMode,
  systemMessage,
}) => {
  // Intercept fetch to transform requests to backend format
  React.useEffect(() => {
    const cleanup = createFetchInterceptor(apiEndpoint, headers, systemMessage);
    return cleanup;
  }, [apiEndpoint, headers, systemMessage]);

  // Create runtime with native assistant-stream support
  const runtime = useDataStreamRuntime({
    api: apiEndpoint,
    headers: headers,
  });

  // Apply dark mode class if needed
  const rootClassName = useMemo(() => {
    return cn("rcs-root", darkMode && "dark", className);
  }, [darkMode, className]);

  return (
    <div className={rootClassName} data-rcs-chat-box>
      <Card className={cn("flex flex-col w-full", className)} style={{ maxHeight }}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <AssistantRuntimeProvider runtime={runtime}>
            <ThreadPrimitive.Root className="flex flex-col h-full">
              <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-4">
                <ThreadPrimitive.Messages
                  components={{
                    UserMessage,
                    AssistantMessage,
                  }}
                />
              </ThreadPrimitive.Viewport>
              <div className="border-t p-4">
                <ComposerPrimitive.Root>
                  <div className="flex gap-2">
                    <ComposerPrimitive.Input
                      placeholder={placeholder}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <ComposerPrimitive.Send className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Send
                    </ComposerPrimitive.Send>
                  </div>
                </ComposerPrimitive.Root>
              </div>
            </ThreadPrimitive.Root>
          </AssistantRuntimeProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBox;
