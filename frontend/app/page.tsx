"use client";

import { MyAssistant } from "@/components/MyAssistant";
import {
  AssistantRuntimeProvider,
  useAssistantInstructions,
  useEdgeRuntime,
} from "@assistant-ui/react";
import { PlanProvider, CreatePlanToolUI, UpdatePlanToolUI } from "@/components/plan/PlanUI";
import { EconDataToolUI } from "@/components/tools/EconDataToolUI";

export default function Home() {
  const runtime = useEdgeRuntime({
    api: "http://localhost:8000/api/chat",
    unstable_AISDKInterop: true,
  });

  return (
    <PlanProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <PlanningAssistant />
      </AssistantRuntimeProvider>
    </PlanProvider>
  );
}

function PlanningAssistant() {
  useAssistantInstructions(
    "You are a planning assistant. Use the plan tools to show progress, and give a succinct summary once the plan is complete.",
  );

  return (
    <main className="flex h-dvh flex-col bg-background">
      <MyAssistant tools={[CreatePlanToolUI, UpdatePlanToolUI, EconDataToolUI]} />
    </main>
  );
}
