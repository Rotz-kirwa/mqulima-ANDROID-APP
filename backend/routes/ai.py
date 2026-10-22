import json
import logging
import os
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

AI_SYSTEM = (
    "You are Mqulima AI, the farm advisor of Mqulima — Africa's 360° agriculture ecosystem based in Kenya. "
    "Give practical, accurate, concise advice on crops, livestock, poultry, dairy, soil, pests, diseases, fertilizer, "
    "irrigation, weather planning, post-harvest and agri-markets, tailored to Kenyan/East African conditions "
    "(use KSh, local varieties, counties and seasons). Use short paragraphs or bullet points, max ~180 words. "
    "When relevant, suggest Mqulima services (soil testing, vet, agronomist consult) or AgroShop inputs. "
    "If a question is outside agriculture, politely steer back to farming. Never invent exact chemical dosages "
    "without advising users to follow the product label."
)


class AiChatIn(BaseModel):
    session_id: str
    message: str


@router.post("/chat")
async def ai_chat(body: AiChatIn):
    history = await db.ai_messages.find({"session_id": body.session_id}, {"_id": 0}).sort("created_at", -1).to_list(10)
    history.reverse()
    transcript = "\n".join(f"{'Farmer' if m['role']=='user' else 'Mqulima AI'}: {m['text']}" for m in history)
    prompt = f"Conversation so far:\n{transcript}\n\nFarmer: {body.message}" if transcript else body.message
    await db.ai_messages.insert_one({"session_id": body.session_id, "role": "user", "text": body.message, "created_at": datetime.now(timezone.utc).isoformat()})

    chat = LlmChat(
        api_key=os.environ.get("EMERGENT_LLM_KEY", ""),
        session_id=f"{body.session_id}-{uuid.uuid4()}",
        system_message=AI_SYSTEM,
    ).with_model("gemini", "gemini-3.1-pro-preview")

    async def gen():
        full = []
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full.append(ev.content)
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception:
            logger.exception("AI chat failed")
            yield f"data: {json.dumps({'error': 'Mqulima AI is unavailable right now. Please try again.'})}\n\n"
        if full:
            await db.ai_messages.insert_one({"session_id": body.session_id, "role": "ai", "text": "".join(full), "created_at": datetime.now(timezone.utc).isoformat()})
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
