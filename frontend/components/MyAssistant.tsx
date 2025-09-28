"use client";

import { Thread, type AssistantToolUI } from "@assistant-ui/react";
import { makeMarkdownText } from "@assistant-ui/react-markdown";

const MarkdownText = makeMarkdownText();

type MyAssistantProps = {
  tools?: AssistantToolUI<any, any>[];
};

export function MyAssistant({ tools }: MyAssistantProps) {
  return (
    <Thread
      tools={tools}
      assistantMessage={{ components: { Text: MarkdownText } }}
    />
  );
}
