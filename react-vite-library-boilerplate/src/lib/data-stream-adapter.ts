/**
 * Adapter to transform @assistant-ui/react-data-stream requests
 * to match the backend's ChatRequest format
 * 
 * Backend expects:
 * {
 *   system: string,
 *   tools: FrontendToolCall[],
 *   messages: LanguageModelV1Message[]
 * }
 * 
 * @assistant-ui/react-data-stream sends:
 * {
 *   messages: [...],
 *   tools: {},
 *   unstable_assistantMessageId: string,
 *   runConfig: {}
 * }
 */

interface AssistantUIMessage {
  role: "user" | "assistant" | "system";
  content: Array<{ type: string; text?: string; [key: string]: any }>;
}

interface AssistantUIRequest {
  messages: AssistantUIMessage[];
  tools?: Record<string, any> | any[];
  unstable_assistantMessageId?: string;
  runConfig?: Record<string, any>;
}

interface BackendChatRequest {
  system: string;
  tools: Array<{ name: string; description?: string; parameters?: Record<string, any> }>;
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: Array<{
      type: string;
      text?: string;
      [key: string]: any;
    }>;
  }>;
}

/**
 * Transforms assistant-ui request format to backend ChatRequest format
 */
export function transformRequestToBackendFormat(
  request: AssistantUIRequest,
  systemMessage?: string
): BackendChatRequest {
  // Extract system message from messages or use provided one
  let system = systemMessage || "";
  const messages: BackendChatRequest["messages"] = [];

  for (const msg of request.messages || []) {
    if (msg.role === "system") {
      // Extract system message content
      const systemContent = msg.content
        ?.filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("") || "";
      if (systemContent) {
        system = systemContent;
      }
    } else if (msg.role === "user" || msg.role === "assistant") {
      // Transform message to backend format
      const transformedContent = (msg.content || []).map((part) => {
        if (part.type === "text") {
          return {
            type: "text" as const,
            text: part.text || "",
          };
        }
        // Handle other part types if needed
        return part;
      });

      messages.push({
        role: msg.role,
        content: transformedContent,
      });
    }
  }

  // Transform tools from object/array to array format
  // Backend expects empty array [] not empty object {}
  let tools: BackendChatRequest["tools"] = [];
  if (request.tools) {
    if (Array.isArray(request.tools) && request.tools.length > 0) {
      tools = request.tools.map((tool) => ({
        name: tool.name || tool,
        description: tool.description,
        parameters: tool.parameters || {},
      }));
    } else if (typeof request.tools === "object" && Object.keys(request.tools).length > 0) {
      // Convert object to array only if it has keys
      tools = Object.entries(request.tools).map(([name, tool]: [string, any]) => ({
        name,
        description: tool?.description,
        parameters: tool?.parameters || {},
      }));
    }
    // If tools is {} or [] (empty), tools remains []
  }

  return {
    system,
    tools,
    messages,
  };
}

/**
 * Creates a wrapper that intercepts fetch calls and transforms requests
 * This is used to adapt @assistant-ui/react-data-stream format to backend format
 */
export function createFetchInterceptor(
  apiEndpoint: string,
  headers: Record<string, string> = {},
  systemMessage?: string
): () => void {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
    
    // Only transform POST requests to our API endpoint
    if (init?.method === "POST" && url.includes(apiEndpoint)) {
      try {
        // Parse original body
        let originalBody: any = {};
        if (init.body) {
          if (typeof init.body === "string") {
            originalBody = JSON.parse(init.body);
          } else if (init.body instanceof FormData) {
            // Handle FormData if needed
            return originalFetch(input, init);
          } else {
            originalBody = init.body;
          }
        }

        console.log("[DataStreamAdapter] Original request:", originalBody);
        
        // Transform the request body
        const transformedBody = transformRequestToBackendFormat(originalBody, systemMessage);
        
        console.log("[DataStreamAdapter] Transformed request:", transformedBody);
        
        // Create new request with transformed body
        const newInit: RequestInit = {
          ...init,
          body: JSON.stringify(transformedBody),
          headers: {
            "Content-Type": "application/json",
            ...headers,
            ...(init?.headers || {}),
          },
        };

        return originalFetch(input, newInit);
      } catch (error) {
        console.error("[DataStreamAdapter] Error transforming request:", error);
        // Fallback to original request
        return originalFetch(input, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...headers,
            ...(init?.headers || {}),
          },
        });
      }
    }

    // For non-POST or non-API requests, use original fetch
    return originalFetch(input, init);
  };

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}
