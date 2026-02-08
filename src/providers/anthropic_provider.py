from typing import AsyncIterator
import anthropic
from src.providers.base import LLMProvider
from src.config import DEFAULT_ANTHROPIC_MODEL


class AnthropicProvider(LLMProvider):

    def __init__(self, api_key: str, model: str = DEFAULT_ANTHROPIC_MODEL):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    async def stream(
        self, system_prompt: str, messages: list[dict], temperature: float = 0.8
    ) -> AsyncIterator[str]:
        async with self.client.messages.stream(
            model=self.model,
            system=system_prompt,
            messages=messages,
            temperature=temperature,
            max_tokens=1024,
        ) as stream:
            async for text in stream.text_stream:
                yield text
