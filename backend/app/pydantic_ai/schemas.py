from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LanguageModelTextPart(BaseModel):
    type: Literal["text"] = "text"
    text: str
    providerMetadata: Any | None = Field(default=None)


class LanguageModelImagePart(BaseModel):
    type: Literal["image"] = "image"
    image: str
    mimeType: str | None = None
    providerMetadata: Any | None = Field(default=None)


class LanguageModelFilePart(BaseModel):
    type: Literal["file"] = "file"
    data: str
    mimeType: str
    providerMetadata: Any | None = Field(default=None)


class LanguageModelToolCallPart(BaseModel):
    type: Literal["tool-call"] = "tool-call"
    toolCallId: str
    toolName: str
    args: Any
    providerMetadata: Any | None = Field(default=None)


class LanguageModelToolResultContentPart(BaseModel):
    type: Literal["text", "image"]
    text: str | None = None
    data: str | None = None
    mimeType: str | None = None


class LanguageModelToolResultPart(BaseModel):
    type: Literal["tool-result"] = "tool-result"
    toolCallId: str
    toolName: str
    result: Any
    isError: bool | None = None
    content: list[LanguageModelToolResultContentPart] | None = None
    providerMetadata: Any | None = Field(default=None)


class LanguageModelSystemMessage(BaseModel):
    role: Literal["system"] = "system"
    content: str


class LanguageModelUserMessage(BaseModel):
    role: Literal["user"] = "user"
    content: list[
        LanguageModelTextPart
        | LanguageModelImagePart
        | LanguageModelFilePart
    ]


class LanguageModelAssistantMessage(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: list[LanguageModelTextPart | LanguageModelToolCallPart]


class LanguageModelToolMessage(BaseModel):
    role: Literal["tool"] = "tool"
    content: list[LanguageModelToolResultPart]


LanguageModelV1Message = (
    LanguageModelSystemMessage
    | LanguageModelUserMessage
    | LanguageModelAssistantMessage
    | LanguageModelToolMessage
)


class FrontendToolCall(BaseModel):
    name: str
    description: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    system: str = ""
    tools: list[FrontendToolCall] = Field(default_factory=list)
    messages: list[LanguageModelV1Message]
