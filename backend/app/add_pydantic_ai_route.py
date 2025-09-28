from __future__ import annotations

import json
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any

from assistant_stream import RunController, create_run
from assistant_stream.serialization import DataStreamResponse
from fastapi import FastAPI
from pydantic_ai._agent_graph import CallToolsNode, ModelRequestNode
from pydantic_ai.agent import AbstractAgent
from pydantic_ai.messages import (
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    ModelMessage,
    ModelRequest,
    ModelResponse,
    ModelResponseStreamEvent,
    PartDeltaEvent,
    PartStartEvent,
    RetryPromptPart,
    SystemPromptPart,
    TextPart,
    TextPartDelta,
    ToolCallPart,
    ToolCallPartDelta,
    ToolReturnPart,
    UserPromptPart,
)
from pydantic_ai.tools import DeferredToolRequests, ToolDefinition
from pydantic_ai.toolsets import AbstractToolset
from pydantic_ai.toolsets.external import ExternalToolset

from .pydantic_ai.schemas import (
    ChatRequest,
    FrontendToolCall,
    LanguageModelAssistantMessage,
    LanguageModelSystemMessage,
    LanguageModelTextPart,
    LanguageModelToolCallPart,
    LanguageModelToolMessage,
    LanguageModelUserMessage,
)


def add_pydantic_ai_route(app: FastAPI, agent: AbstractAgent[Any, Any], path: str) -> None:
    async def chat(request: ChatRequest):
        history = _messages_from_request(request)
        toolsets = _build_toolsets(request.tools)

        async def run(controller: RunController):
            stream_state = _StreamState()
            additional_toolsets: Sequence[AbstractToolset[Any]] | None = toolsets if toolsets else None

            async with agent.iter(
                user_prompt=None,
                message_history=history,
                toolsets=additional_toolsets,
                output_type=[agent.output_type, DeferredToolRequests],
            ) as agent_run:
                async for node in agent_run:
                    if isinstance(node, ModelRequestNode):
                        async with node.stream(agent_run.ctx) as model_stream:
                            async for event in model_stream:
                                await _handle_model_event(controller, stream_state, event)
                    elif isinstance(node, CallToolsNode):
                        async with node.stream(agent_run.ctx) as tool_stream:
                            async for event in tool_stream:
                                await _handle_tool_event(controller, stream_state, event)

        return DataStreamResponse(create_run(run))

    app.add_api_route(path, chat, methods=["POST"])


@dataclass(slots=True)
class _StreamState:
    tool_controllers: dict[str, Any] = field(default_factory=dict)

    async def ensure_tool_controller(
        self,
        controller: RunController,
        tool_name: str,
        tool_call_id: str,
    ) -> Any:
        if tool_call_id not in self.tool_controllers:
            self.tool_controllers[tool_call_id] = await controller.add_tool_call(tool_name, tool_call_id)
        return self.tool_controllers[tool_call_id]


def _messages_from_request(chat: ChatRequest) -> list[ModelMessage]:
    history: list[ModelMessage] = []
    tool_names: dict[str, str] = {}

    if chat.system.strip():
        history.append(ModelRequest(parts=[SystemPromptPart(content=chat.system)]))

    for message in chat.messages:
        if isinstance(message, LanguageModelSystemMessage):
            history.append(ModelRequest(parts=[SystemPromptPart(content=message.content)]))
        elif isinstance(message, LanguageModelUserMessage):
            content = " ".join(
                part.text
                for part in message.content
                if isinstance(part, LanguageModelTextPart) and part.text.strip()
            ).strip()
            if content:
                history.append(ModelRequest(parts=[UserPromptPart(content=content)]))
        elif isinstance(message, LanguageModelAssistantMessage):
            text_content = " ".join(
                part.text for part in message.content if isinstance(part, LanguageModelTextPart)
            ).strip()
            if text_content:
                history.append(ModelResponse(parts=[TextPart(content=text_content)]))

            tool_parts: list[ToolCallPart] = []
            for part in message.content:
                if isinstance(part, LanguageModelToolCallPart):
                    tool_parts.append(
                        ToolCallPart(
                            tool_name=part.toolName,
                            args=part.args,
                            tool_call_id=part.toolCallId,
                        )
                    )
                    tool_names[part.toolCallId] = part.toolName
            if tool_parts:
                history.append(ModelResponse(parts=tool_parts))
        elif isinstance(message, LanguageModelToolMessage):
            for part in message.content:
                history.append(
                    ModelRequest(
                        parts=[
                            ToolReturnPart(
                                tool_name=part.toolName or tool_names.get(part.toolCallId, part.toolCallId),
                                content=part.result,
                                tool_call_id=part.toolCallId,
                            )
                        ]
                    )
                )

    return history


async def _handle_model_event(
    controller: RunController,
    state: _StreamState,
    event: ModelResponseStreamEvent,
) -> None:
    if isinstance(event, PartStartEvent):
        part = event.part
        if isinstance(part, TextPart):
            if part.content:
                controller.append_text(part.content)
        elif isinstance(part, ToolCallPart):
            tool_controller = await state.ensure_tool_controller(controller, part.tool_name, part.tool_call_id)
            if part.args is not None:
                tool_controller.append_args_text(_format_args(part.args))
    elif isinstance(event, PartDeltaEvent):
        delta = event.delta
        if isinstance(delta, TextPartDelta):
            if delta.content_delta:
                controller.append_text(delta.content_delta)
        elif isinstance(delta, ToolCallPartDelta):
            tool_call_id = delta.tool_call_id
            if tool_call_id and tool_call_id in state.tool_controllers and delta.args_delta is not None:
                state.tool_controllers[tool_call_id].append_args_text(_format_args(delta.args_delta))


async def _handle_tool_event(
    controller: RunController,
    state: _StreamState,
    event: FunctionToolCallEvent | FunctionToolResultEvent,
) -> None:
    if isinstance(event, FunctionToolCallEvent):
        tool_call = event.part
        tool_controller = await state.ensure_tool_controller(
            controller,
            tool_call.tool_name,
            tool_call.tool_call_id,
        )
        if tool_call.args is not None:
            tool_controller.append_args_text(_format_args(tool_call.args))
        return

    result = event.result
    if isinstance(result, ToolReturnPart):
        tool_controller = await state.ensure_tool_controller(controller, result.tool_name, result.tool_call_id)
        tool_controller.set_result(result.model_response_str())
    elif isinstance(result, RetryPromptPart):
        tool_controller = await state.ensure_tool_controller(controller, result.tool_name or "tool", result.tool_call_id)
        tool_controller.set_result(result.model_response())


def _build_toolsets(tools: list[FrontendToolCall]) -> list[AbstractToolset[Any]]:
    if not tools:
        return []

    tool_defs = [
        ToolDefinition(
            name=tool.name,
            description=tool.description,
            parameters_json_schema=tool.parameters,
        )
        for tool in tools
    ]
    return [ExternalToolset(tool_defs)]


def _format_args(value: Any) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value)
