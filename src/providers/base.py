from abc import ABC, abstractmethod
from typing import AsyncIterator


class LLMProvider(ABC):
    """Base class for LLM API providers."""

    @abstractmethod
    async def stream(
        self, system_prompt: str, messages: list[dict], temperature: float = 0.8
    ) -> AsyncIterator[str]:
        """Yield text chunks from the model."""
        ...

    async def generate(
        self, system_prompt: str, messages: list[dict], temperature: float = 0.8
    ) -> str:
        chunks = []
        async for chunk in self.stream(system_prompt, messages, temperature):
            chunks.append(chunk)
        return "".join(chunks)
