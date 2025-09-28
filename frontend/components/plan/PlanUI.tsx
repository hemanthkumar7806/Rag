"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";

type StepStatus = "pending" | "completed";

export type PlanStep = {
  description: string;
  status: StepStatus;
};

export type Plan = {
  steps: PlanStep[];
};

type PlanContextValue = {
  plan: Plan | null;
  setPlan: (plan: Plan | null) => void;
  updateStep: (update: { index: number; description?: string; status?: StepStatus }) => void;
};

const defaultContext: PlanContextValue = {
  plan: null,
  setPlan: () => {},
  updateStep: () => {},
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan | null>(null);

  const updateStep = useCallback(
    (update: { index: number; description?: string; status?: StepStatus }) => {
      setPlan((prev) => {
        if (!prev) {
          return prev;
        }

        if (update.index < 0 || update.index >= prev.steps.length) {
          return prev;
        }

        return {
          steps: prev.steps.map((step, idx) => {
            if (idx !== update.index) {
              return step;
            }
            return {
              description: update.description ?? step.description,
              status: update.status ?? step.status,
            } satisfies PlanStep;
          }),
        } satisfies Plan;
      });
    },
    [setPlan],
  );

  const value = useMemo<PlanContextValue>(
    () => ({ plan, setPlan, updateStep }),
    [plan, setPlan, updateStep],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

function usePlanContext() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlanContext must be used inside PlanProvider");
  }
  return ctx;
}

function usePlanContextOptional() {
  return useContext(PlanContext) ?? defaultContext;
}

type CreatePlanResult = {
  plan: Plan;
};

type UpdatePlanResult = {
  index: number;
  description?: string;
  status?: StepStatus;
};

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asRecord(parsed);
    } catch (error) {
      console.warn("Failed to parse plan JSON", error);
      return null;
    }
  }

  if (typeof value === "object" && value !== null) {
    return value as AnyRecord;
  }

  return null;
}

function normalizeStep(value: unknown): PlanStep | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const description = typeof record.description === "string" ? record.description : null;
  const status = record.status === "completed" ? "completed" : "pending";

  if (!description) {
    return null;
  }

  return { description, status } satisfies PlanStep;
}

function normalizePlan(value: unknown): Plan | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const stepsSource = Array.isArray(record.steps) ? record.steps : [];
  if (stepsSource.length === 0) {
    return null;
  }

  const steps: PlanStep[] = [];

  for (const step of stepsSource) {
    const normalized = normalizeStep(step);
    if (normalized) {
      steps.push(normalized);
    }
  }

  if (steps.length === 0) {
    return null;
  }

  return { steps } satisfies Plan;
}

function normalizeCreateResult(value: unknown): Plan | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  if (record.plan) {
    return normalizePlan(record.plan);
  }

  return normalizePlan(record);
}

function normalizeUpdateResult(value: unknown): UpdatePlanResult | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const indexRaw = record.index;
  const index = typeof indexRaw === "number" ? indexRaw : Number.parseInt(String(indexRaw ?? "-1"), 10);

  if (!Number.isFinite(index) || index < 0) {
    return null;
  }

  const update: UpdatePlanResult = { index };

  if (typeof record.description === "string") {
    update.description = record.description;
  }

  if (record.status === "completed") {
    update.status = "completed";
  } else if (record.status === "pending") {
    update.status = "pending";
  }

  return update;
}

export const CreatePlanToolUI = makeAssistantToolUI<any, CreatePlanResult>({
  toolName: "create_plan",
  render: ({ result, status }) => {
    const { plan, setPlan } = usePlanContextOptional();
    const normalized = useMemo(() => normalizeCreateResult(result), [result]);

    useEffect(() => {
      if (normalized) {
        setPlan(normalized);
      }
    }, [normalized, setPlan]);

    const displayPlan = plan ?? normalized;

    if (displayPlan) {
      return <PlanCard title="Plan progress" plan={displayPlan} emphasizeCurrent collapseOnComplete />;
    }

    if (status.type === "running") {
      return (
        <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-sm text-muted-foreground">
          Generating plan...
        </div>
      );
    }

    return null;
  },
});

export const UpdatePlanToolUI = makeAssistantToolUI<any, UpdatePlanResult>({
  toolName: "update_plan_step",
  render: ({ result }) => {
    const { updateStep } = usePlanContextOptional();
    const normalized = useMemo(() => normalizeUpdateResult(result), [result]);

    useEffect(() => {
      if (normalized) {
        updateStep(normalized);
      }
    }, [normalized, updateStep]);

    return null;
  },
});

type PlanCardProps = {
  title: string;
  plan?: Plan;
  emphasizeCurrent?: boolean;
  collapseOnComplete?: boolean;
};

function PlanCard({ title, plan, emphasizeCurrent = false }: PlanCardProps) {
  if (!plan || plan.steps.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/50 p-3 text-sm text-muted-foreground">
        {title}: waiting for plan data.
      </div>
    );
  }

  const completed = plan.steps.filter((step) => step.status === "completed").length;
  const progress = plan.steps.length === 0 ? 0 : Math.round((completed / plan.steps.length) * 100);
  const allComplete = plan.steps.every((step) => step.status === "completed");

  const [showCompleted, setShowCompleted] = useState(!allComplete);

  useEffect(() => {
    setShowCompleted(!allComplete);
  }, [allComplete]);

  const firstPending = emphasizeCurrent
    ? plan.steps.findIndex((step) => step.status === "pending")
    : -1;

  if (allComplete) {
    return (
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{title} complete</p>
              <p className="text-xs uppercase tracking-wide">All steps finished</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompleted((prev) => !prev)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showCompleted ? "Hide steps" : "View steps"}
            </button>
          </div>

          {showCompleted ? (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {plan.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-emerald-500">✔</span>
                  <span>{step.description}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
    );
  }

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <div className="space-y-4 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {completed}/{plan.steps.length} completed
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {progress}%
          </span>
        </header>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <ul className="space-y-2">
          {plan.steps
            .filter((step) => showCompleted || step.status !== "completed")
            .map((step, index) => {
              const isCompleted = step.status === "completed";
              const isCurrent = emphasizeCurrent && index === firstPending;

              return (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 p-3 text-sm transition"
                  data-testid="plan-item"
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isCompleted ? "bg-emerald-500 text-white" : isCurrent ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"}`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-foreground"}`}>
                      {step.description}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {step.status}
                    </p>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="border-t border-border/30 px-6 py-3 text-right">
        <button
          type="button"
          onClick={() => setShowCompleted((prev) => !prev)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </div>

      {emphasizeCurrent ? (
        <div className="pointer-events-none absolute -right-10 -top-20 h-40 w-40 rounded-full bg-primary/10" />
      ) : null}
    </div>
  );
}
