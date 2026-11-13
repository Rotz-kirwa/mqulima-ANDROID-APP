import asyncio
import base64
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import get_settings
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

_CLEAN_RE = re.compile(r"[\x00-\x1f\x7f]")
_MAX_IMAGE_BYTES = 1_500_000  # 1.5 MB ceiling for compressed base64 crop diagnosis uploads

_FALLBACK_KB: Dict[str, Dict[str, Any]] = {
    "maize": {
        "condition": "Possible Fall Armyworm / Leaf Blight Stress",
        "severity": "Moderate",
        "summary": "Check the inner maize whorl for frass or shot-holes (Fall Armyworm) and inspect lower leaves for elongated necrotic lesions (Northern Corn Leaf Blight).",
        "immediateActions": [
            "Scout 20 plants across a W-pattern in your field early morning or late afternoon.",
            "Destroy severely infested residues and keep weeds clear around plot borders.",
            "Spray only during cool hours when wind is calm; verify Mqulima Weather Spray Window first.",
        ],
        "organicRemedies": [
            "Neem-based bio-pesticide (azadirachtin) applied directly into the whorl at early instar stage.",
            "Push-pull intercropping with Desmodium and Napier grass around margins.",
        ],
        "chemicalRemedies": [
            "Follow product label directions on PCPB-registered Emamectin Benzoate or Lambda-Cyhalothrin for severe Fall Armyworm.",
            "Copper oxychloride or Mancozeb protectants for fungal foliar lesions (always follow label safety intervals).",
        ],
        "preventionTips": [
            "Plant early at the onset of rains using certified resistant seed.",
            "Rotate maize with legumes (beans/soybean) next season to break pest cycles.",
        ],
    },
    "tomato": {
        "condition": "Suspected Early / Late Blight or Tuta absoluta",
        "severity": "High",
        "summary": "Dark concentric rings (Early Blight), water-soaked leaf blotches (Late Blight), or leaf-mining tunnels (Tuta absoluta) spread rapidly in humid mornings.",
        "immediateActions": [
            "Prune yellowing lower leaves touching soil and dispose outside the greenhouse or plot.",
            "Avoid overhead evening irrigation to shorten leaf wetness duration.",
            "Check yellow sticky traps or pheromone lures twice weekly.",
        ],
        "organicRemedies": [
            "Ensure wide plant spacing for airflow and mulch cleanly to prevent soil splash.",
            "Neem bio-pesticide spray every 7 days for low pest pressure.",
        ],
        "chemicalRemedies": [
            "Consult PCPB-registered Metalaxyl + Mancozeb or Azoxystrobin fungicides alternating FRAC groups per product label.",
            "Use registered Spinetoram / Indoxacarb strictly per label pre-harvest interval for Tuta absoluta.",
        ],
        "preventionTips": [
            "Use drip irrigation and certified disease-free seedlings.",
            "Sanitize pruning shears between rows.",
        ],
    },
    "potato": {
        "condition": "Suspected Late Blight (Phytophthora infestans) or Bacterial Wilt",
        "severity": "High",
        "summary": "Highland cool wet spells accelerate Late Blight on leaves and stems; sudden green wilting in warm afternoon points to Bacterial Wilt in soil.",
        "immediateActions": [
            "Uproot bacterial wilt plants with surrounding soil into a sealed sack — do not compost.",
            "Earth up ridges properly to protect developing tubers from spores washed down by rain.",
        ],
        "organicRemedies": [
            "Strict 3–4 season crop rotation away from tomatoes, capsicum, and nightshades.",
            "Apply well-decomposed manure and wood ash to improve drainage.",
        ],
        "chemicalRemedies": [
            "Apply preventive Mancozeb before rains and systemic/translaminar fungicide per label directions when blight pressure rises.",
        ],
        "preventionTips": [
            "Source certified clean seed tubers rather than recycled market ware potatoes.",
        ],
    },
}


def _sanitize_text(val: str, limit: int) -> str:
    return _CLEAN_RE.sub(" ", val or "").strip()[:limit]


def _build_agronomy_fallback(crop: str, symptoms: Dict[str, bool], county: str, question: str) -> Dict[str, Any]:
    key = crop.lower().strip()
    matched = None
    for k, profile in _FALLBACK_KB.items():
        if k in key:
            matched = profile
            break
    if matched is None:
        matched = {
            "condition": f"{crop or 'Crop'} Stress Assessment (Offline Agronomy Guide)",
            "severity": "Moderate",
            "summary": "Live AI vision inference experienced high load or timeout. Below is verified field triage guidance while connectivity stabilizes.",
            "immediateActions": [
                "Photograph both upper and lower leaf surfaces, stem base, and healthy neighbour plants in bright daylight.",
                "Isolate heavily wilted plants and avoid irrigating foliage late in the day.",
                "Verify county rain & wind forecasts on Mqulima Weather Radar before spraying.",
            ],
            "organicRemedies": [
                "Apply cold-pressed neem extract early morning and improve soil organic matter compost.",
            ],
            "chemicalRemedies": [
                "Have a certified agrovet or Mqulima Agronomist verify the pathogen before spraying; strictly follow PCPB label dosage and Pre-Harvest Interval.",
            ],
            "preventionTips": [
                "Use certified seed, clean tools, and seasonal crop rotation.",
            ],
        }

    active_symptoms = [k.replace("_", " ") for k, v in (symptoms or {}).items() if v]
    loc_note = f" in {county}" if county else ""
    symptom_note = f" Reported signs: {', '.join(active_symptoms)}." if active_symptoms else ""
    question_note = f" Question noted: {question}" if question else ""
    return {
        **matched,
        "crop": crop or "General Crop",
        "county": county or "Kenya",
        "summary": f"{matched['summary']}{symptom_note}{loc_note}.{question_note}".strip(),
        "confidence": "Fallback Guidance",
        "source": "offline_agronomy_fallback",
        "followUpQuestion": "Book an Mqulima Agronomist field check or retry photo analysis when signal strengthens.",
    }


class AiChatIn(BaseModel):
    session_id: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=1500)


class CropDoctorIn(BaseModel):
    crop: str = Field(default="Maize", max_length=80)
    symptoms: Dict[str, bool] = Field(default_factory=dict)
    imageBase64: Optional[str] = Field(default=None, max_length=2_400_000)
    county: str = Field(default="", max_length=60)
    subCounty: str = Field(default="", max_length=60)
    farmerQuestion: str = Field(default="", max_length=500)


@router.post("/chat")
async def ai_chat(body: AiChatIn):
    settings = get_settings()
    clean_session = _sanitize_text(body.session_id, 120)
    clean_message = _sanitize_text(body.message, 1500)
    if not clean_message:
        raise HTTPException(422, "Message cannot be empty")

    try:
        history = await db.ai_messages.find({"session_id": clean_session}, {"_id": 0}).sort("created_at", -1).to_list(10)
        history.reverse()
        transcript = "\n".join(f"{'Farmer' if m['role'] == 'user' else 'Mqulima AI'}: {m['text']}" for m in history)
        prompt = f"Conversation so far:\n{transcript}\n\nFarmer: {clean_message}" if transcript else clean_message
        await db.ai_messages.insert_one({"session_id": clean_session, "role": "user", "text": clean_message, "created_at": datetime.now(timezone.utc).isoformat()})
    except Exception:
        prompt = clean_message

    api_key = settings.EMERGENT_LLM_KEY.strip()
    if not api_key:
        fallback_reply = (
            "Mqulima AI live chat is currently in fallback mode. "
            "Check Weather Radar, KAMIS Markets, or book an agronomist/vet in Services for urgent field support."
        )

        async def fallback_gen():
            yield f"data: {json.dumps({'delta': fallback_reply})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(fallback_gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    chat = LlmChat(
        api_key=api_key,
        session_id=f"{clean_session}-{uuid.uuid4()}",
        system_message=AI_SYSTEM,
    ).with_model("gemini", "gemini-3.1-pro-preview")

    async def gen():
        full: List[str] = []
        try:
            async def _drain():
                async for ev in chat.stream_message(UserMessage(text=prompt)):
                    if isinstance(ev, TextDelta):
                        full.append(ev.content)
                        yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                    elif isinstance(ev, StreamDone):
                        break

            stream_iter = _drain()
            while True:
                try:
                    chunk = await asyncio.wait_for(stream_iter.__anext__(), timeout=settings.AI_TIMEOUT_SECONDS)
                    yield chunk
                except StopAsyncIteration:
                    break
        except asyncio.TimeoutError:
            logger.warning("AI chat timed out after %.1fs", settings.AI_TIMEOUT_SECONDS)
            yield f"data: {json.dumps({'error': 'Mqulima AI took too long to respond on the network. Please retry shortly.'})}\n\n"
        except Exception:
            logger.exception("AI chat failed")
            yield f"data: {json.dumps({'error': 'Mqulima AI is unavailable right now. Please try again.'})}\n\n"
        if full:
            try:
                await db.ai_messages.insert_one({"session_id": clean_session, "role": "ai", "text": "".join(full), "created_at": datetime.now(timezone.utc).isoformat()})
            except Exception:
                pass
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/crop-doctor")
async def crop_doctor(body: CropDoctorIn):
    """Diagnoses crop pests/diseases with compressed image guard, timeout, and agronomy fallback."""
    settings = get_settings()
    crop = _sanitize_text(body.crop, 80) or "Maize"
    county = _sanitize_text(body.county, 60)
    subcounty = _sanitize_text(body.subCounty, 60)
    question = _sanitize_text(body.farmerQuestion, 500)

    if body.imageBase64:
        raw_b64 = body.imageBase64.split(",", 1)[-1].strip()
        try:
            decoded = base64.b64decode(raw_b64, validate=True)
        except Exception:
            raise HTTPException(422, "Invalid compressed image payload.")
        if len(decoded) > _MAX_IMAGE_BYTES:
            raise HTTPException(413, "Compressed crop photo exceeds 1.5MB upload limit.")

    api_key = settings.EMERGENT_LLM_KEY.strip()
    if not api_key:
        return {"success": True, "diagnosis": _build_agronomy_fallback(crop, body.symptoms, county, question)}

    symptom_list = ", ".join(k.replace("_", " ") for k, v in (body.symptoms or {}).items() if v) or "unspecified visual symptoms"
    prompt = (
        f"Kenyan Crop Doctor triage request. Crop: {crop}. Location: {county} {subcounty}. "
        f"Reported signs: {symptom_list}. Question: {question or 'Diagnose likely pest/disease and practical remedies.'} "
        "Reply STRICTLY as JSON with keys: condition, severity (Low/Moderate/High), confidence, summary, "
        "immediateActions (array), organicRemedies (array), chemicalRemedies (array), preventionTips (array)."
    )

    chat = LlmChat(
        api_key=api_key,
        session_id=f"cropdoc-{uuid.uuid4()}",
        system_message=AI_SYSTEM,
    ).with_model("gemini", "gemini-2.5-flash")

    try:
        chunks: List[str] = []

        async def _infer():
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    chunks.append(ev.content)
                elif isinstance(ev, StreamDone):
                    break

        await asyncio.wait_for(_infer(), timeout=settings.AI_TIMEOUT_SECONDS)
        text = "".join(chunks).strip()
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            if isinstance(parsed, dict) and parsed.get("condition"):
                parsed["source"] = "gemini_ai"
                return {"success": True, "diagnosis": parsed}
    except asyncio.TimeoutError:
        logger.warning("Crop doctor AI timed out after %.1fs; serving fallback.", settings.AI_TIMEOUT_SECONDS)
    except Exception as exc:
        logger.warning("Crop doctor AI degraded (%s); serving fallback.", exc)

    return {"success": True, "diagnosis": _build_agronomy_fallback(crop, body.symptoms, county, question)}
