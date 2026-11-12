import asyncio
from typing import AsyncGenerator


class TextDelta:
    def __init__(self, content: str = ""):
        self.content = content


class StreamDone:
    pass


class UserMessage:
    def __init__(self, text: str = ""):
        self.text = text


class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "gemini"
        self.model = "gemini-3.1-pro-preview"

    def with_model(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        return self

    async def stream_message(self, user_message: UserMessage) -> AsyncGenerator:
        try:
            import litellm
            if self.api_key:
                response = await litellm.acompletion(
                    model=f"gemini/{self.model}" if self.provider == "gemini" and not self.model.startswith("gemini/") else self.model,
                    messages=[
                        {"role": "system", "content": self.system_message},
                        {"role": "user", "content": user_message.text},
                    ],
                    stream=True,
                    api_key=self.api_key,
                )
                async for chunk in response:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        yield TextDelta(content)
                yield StreamDone()
                return
        except Exception:
            pass

        # Fallback response for offline or unconfigured API key
        yield TextDelta("Habari! Mqulima AI is ready to assist with crop advice, pest control, fertilizers, and market trends tailored to your county.")
        yield StreamDone()
