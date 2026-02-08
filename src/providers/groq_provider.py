from typing import AsyncIterator
from groq import AsyncGroq
from src.providers.base import LLMProvider
from src.config import DEFAULT_GROQ_MODEL


class GroqProvider(LLMProvider):

    def __init__(self, api_key: str, model: str = DEFAULT_GROQ_MODEL):
        self.client = AsyncGroq(api_key=api_key)
        self.model = model

    async def stream(
        self, system_prompt: str, messages: list[dict], temperature: float = 0.8
    ) -> AsyncIterator[str]:
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            temperature=temperature,
            stream=True,
            max_tokens=1024,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
