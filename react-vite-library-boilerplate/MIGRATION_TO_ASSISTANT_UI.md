# Migration Guide: AI SDK → @assistant-ui/react

## Why Migrate?

- ✅ **Native `assistant-stream` support** - No custom transport needed
- ✅ **Rich UI components** - Tool calls, streaming, interruptions built-in
- ✅ **Less maintenance** - No format conversion layer
- ✅ **Better fit** - Designed for your backend setup

## Step 1: Install Dependencies

```bash
npm install @assistant-ui/react @assistant-ui/react-data-stream
```

## Step 2: Update Backend (if needed)

Your backend already uses `assistant-stream`, so it should work as-is. Just ensure:
- Endpoint returns `DataStreamResponse` (you already do this)
- Headers include `x-vercel-ai-ui-message-stream: v1` (optional but recommended)

## Step 3: Replace ChatBox Component

### Old (AI SDK):
```typescript
import { useChat } from "@ai-sdk/react";
import { createPydanticAITransport } from "../lib/pydantic-ai-transport";

const transport = createPydanticAITransport({ api: apiEndpoint });
const { messages, sendMessage } = useChat({ transport });
```

### New (@assistant-ui/react):
```typescript
import { Thread } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useDataStreamRuntime } from "@assistant-ui/react-data-stream";

const runtime = useDataStreamRuntime({
  api: apiEndpoint,
  headers: headers,
});

return (
  <AssistantRuntimeProvider runtime={runtime}>
    <Thread />
  </AssistantRuntimeProvider>
);
```

## Step 4: Remove Custom Transport

You can delete:
- `pydantic-ai-transport.ts` (890 lines)
- `pydantic-ai-transport-types.ts` (160 lines)
- `MAINTENANCE.md` (no longer needed)

## Step 5: Customize UI (Optional)

`@assistant-ui/react` is highly customizable:

```typescript
import { Thread, Composer, Message } from "@assistant-ui/react";

<Thread>
  <Message />
  <Composer />
</Thread>
```

## Benefits After Migration

1. **No custom transport** - Native support
2. **Rich UI** - Tool calls, streaming, interruptions
3. **Less code** - Remove ~1000 lines of transport code
4. **Better maintenance** - Official support for `assistant-stream`
5. **Type safety** - Built-in TypeScript support

## Example Full Component

```typescript
import { Thread } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useDataStreamRuntime } from "@assistant-ui/react-data-stream";

export const ChatBox: React.FC<ChatBoxProps> = ({
  apiEndpoint,
  headers = {},
  className,
}) => {
  const runtime = useDataStreamRuntime({
    api: apiEndpoint,
    headers: headers,
  });

  return (
    <div className={className}>
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread />
      </AssistantRuntimeProvider>
    </div>
  );
};
```

## Resources

- Docs: https://www.assistant-ui.com/
- Runtime: https://www.assistant-ui.com/docs/runtimes/data-stream
- Components: https://www.assistant-ui.com/docs/components/thread
