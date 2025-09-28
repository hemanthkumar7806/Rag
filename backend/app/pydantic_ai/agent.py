from __future__ import annotations

import os
from textwrap import dedent
from typing import Any, Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from .tools import toolset

StepStatus = Literal["pending", "completed"]


class Step(BaseModel):
    description: str
    status: StepStatus = "pending"


class Plan(BaseModel):
    steps: list[Step] = Field(default_factory=list)


agent = Agent(
    model=OpenAIChatModel(
        model_name="gpt-4.1-mini",
        provider=OpenAIProvider(api_key=os.getenv("OPENAI_API_KEY")),
    ),
    instructions=dedent(
        """
        You are a helpful assistant. Answer user questions clearly and call tools when appropriate.

        When you need to execute multi-step tasks, use the planning tools provided:
        - Call `create_plan` once to outline 3-6 concrete steps for the task.
        - As progress is made, call `update_plan_step` to refine descriptions or mark steps as completed.
        - Keep plan updates confined to these tools so the UI can display your progress.
        - After completing the plan, send a concise final response summarizing the outcome.
        """
    ),
    toolsets=[toolset],
)


@agent.tool_plain
async def create_plan(steps: list[str]) -> dict[str, Any]:
    plan = Plan(steps=[Step(description=step) for step in steps])
    return {"plan": plan.model_dump()}


@agent.tool_plain
async def update_plan_step(
    index: int,
    description: str | None = None,
    status: StepStatus | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"index": index}
    if description is not None:
        payload["description"] = description
    if status is not None:
        payload["status"] = status
    return payload


__all__ = ["agent"]
