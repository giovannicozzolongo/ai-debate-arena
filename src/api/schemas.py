from pydantic import BaseModel


class DebateRequest(BaseModel):
    topic: str
    num_rounds: int = 3
    provider: str = "groq"  # groq | anthropic | openai
    api_key: str | None = None  # for BYOK, overrides server .env


class DebateEvent(BaseModel):
    """Single SSE event payload."""
    type: str  # round_start | pro_chunk | con_chunk | round_end | judge | error | done
    round: int | None = None
    content: str = ""
