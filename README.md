# assistant-ui-pydantic-ai-fastapi


A demonstration project that combines Pydantic-AI, assistant-stream, and FastAPI to create an AI agent with a modern UI. The project uses [assistant-ui](https://www.assistant-ui.com/) and Next.js.

## Overview

This project showcases:

- A Pydantic-AI agent running on a FastAPI
- A modern chat UI built with assistant-ui and Next.js
- Demonstrate how to integrate external tools and APIs
- Demonstrate how to set up [generative UI](https://www.assistant-ui.com/docs/guides/ToolUI) with a Python backend instead of Vercel AI SDK

## Prerequisites

- Python 3.11
- Node.js v20

## Project Structure

```
assistant-ui-pydantic-ai-fastapi/
├── backend/         # FastAPI + Pydantic-AI server
└── frontend/        # Next.js + assistant-ui client
```

## Setup Instructions

### Set up environment variables

Go to `./backend` and create `.env` file. Follow the example in `.env.example`.

### Backend Setup


```bash
cd backend
uv sync
uv run python -m app.server
```

### Frontend Setup

The frontend is generated using the assistant-ui CLI tool.

```bash
cd frontend
pnpm install
pnpm dev
```

## Credits

- Original structure adapted from: [Yonom/assistant-ui-langgraph-fastapi](https://github.com/Yonom/assistant-ui-langgraph-fastapi)
- Planning tools adapted from [Pydantic-AI example](https://ai.pydantic.dev/examples/ag-ui/#agentic-generative-ui-code)