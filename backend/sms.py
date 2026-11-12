import os
import re
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import httpx
from db import db

logger = logging.getLogger("sms_service")

TEXTSMS_API_KEY = os.getenv("TEXTSMS_API_KEY", "82b5401f7d2d708f19d78f405cb4acab")
TEXTSMS_PARTNER_ID = os.getenv("TEXTSMS_PARTNER_ID", "16948")
TEXTSMS_SENDER_ID = os.getenv("TEXTSMS_SENDER_ID", "KIRGIT_AGRI")
TEXTSMS_API_URL = os.getenv("TEXTSMS_API_URL", "https://sms.textsms.co.ke/api/services/sendsms/")
TEXTSMS_MOCK_MODE = os.getenv("TEXTSMS_MOCK_MODE", "false").lower() in ("true", "1")


def normalize_kenyan_phone(phone: str) -> str:
    """Normalizes Kenyan phone numbers to standard 254XXXXXXXXX format."""
    if not phone:
        raise ValueError("Phone number is required")
    cleaned = re.sub(r"[^0-9+]", "", phone.strip())
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    if cleaned.startswith("0"):
        cleaned = "254" + cleaned[1:]
    elif not cleaned.startswith("254") and (cleaned.startswith("7") or cleaned.startswith("1")):
        cleaned = "254" + cleaned

    if not re.match(r"^254[17][0-9]{8}$", cleaned):
        raise ValueError(f"Invalid Kenyan phone number format: '{phone}'. Expected 07XXXXXXXX or 2547XXXXXXXX")
    return cleaned


def redact_sensitive(msg: str) -> str:
    """Redacts passwords and tokens from logged messages."""
    return re.sub(
        r"(your password is:\s*)([^\s\n]+)",
        r"\1[REDACTED]",
        msg,
        flags=re.IGNORECASE,
    )


async def log_sms_attempt(recipient: str, message: str, trigger_type: str, status: str, response_payload: Any) -> None:
    """Records every SMS dispatch attempt into the sms_logs collection for admin auditing."""
    try:
        entry = {
            "recipient": recipient,
            "message": redact_sensitive(message),
            "trigger_type": trigger_type,
            "status": status,
            "response_payload": response_payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db["sms_logs"].insert_one(entry)
    except Exception as exc:
        logger.warning(f"Failed to record sms_log: {exc}")


async def send_sms(phone: str, message: str, trigger_type: str = "signup_welcome") -> Dict[str, Any]:
    """
    Sends transactional SMS via TextSMS Kenya API.
    Never throws exceptions that break the caller.
    """
    try:
        normalized_phone = normalize_kenyan_phone(phone)
    except ValueError as val_err:
        logger.error(f"[SMS] Normalization error: {val_err}")
        res = {"success": False, "error": str(val_err)}
        await log_sms_attempt(phone, message, trigger_type, "failed", res)
        return res

    if TEXTSMS_MOCK_MODE:
        logger.info(f"[SMS MOCK] Simulated SMS to {normalized_phone} ({trigger_type}): '{message}'")
        mock_res = {"success": True, "mocked": True, "message_id": f"mock_{int(datetime.now().timestamp())}"}
        await log_sms_attempt(normalized_phone, message, trigger_type, "mocked", mock_res)
        return mock_res

    payload = {
        "apikey": TEXTSMS_API_KEY,
        "partnerID": TEXTSMS_PARTNER_ID,
        "shortcode": TEXTSMS_SENDER_ID,
        "mobile": normalized_phone,
        "message": message,
    }

    try:
        logger.info(f"[SMS] Dispatching to {normalized_phone} via TextSMS API (Sender: {TEXTSMS_SENDER_ID})...")
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(TEXTSMS_API_URL, json=payload)
            data = resp.json() if resp.status_code == 200 else {"raw": resp.text}

        # Check response code according to TextSMS Kenya spec
        responses = data.get("responses", [])
        first_resp = responses[0] if responses else {}
        resp_code = first_resp.get("response-code") or first_resp.get("respose-code")

        if resp.is_success and resp_code == 200:
            msg_id = str(first_resp.get("messageid", ""))
            logger.info(f"[SMS] Delivered successfully to {normalized_phone}. Message ID: {msg_id}")
            result = {"success": True, "message_id": msg_id, "mobile": normalized_phone}
            await log_sms_attempt(normalized_phone, message, trigger_type, "success", data)
            return result
        else:
            err_desc = first_resp.get("response-description") or "API rejected dispatch"
            logger.error(f"[SMS] TextSMS API rejected dispatch to {normalized_phone}: {err_desc}")
            result = {"success": False, "error": err_desc}
            await log_sms_attempt(normalized_phone, message, trigger_type, "failed", data)
            return result

    except Exception as exc:
        logger.error(f"[SMS] Exception dispatching SMS to {normalized_phone}: {exc}")
        result = {"success": False, "error": str(exc)}
        await log_sms_attempt(normalized_phone, message, trigger_type, "failed", {"error": str(exc)})
        return result


async def send_welcome_sms(full_name: str, phone: str, password: Optional[str] = None) -> Dict[str, Any]:
    """Dispatches the official Mqulima welcome message upon registration."""
    first_name = (full_name.split()[0] if full_name else "Farmer").strip()
    pw_part = f"\nYour password is: {password}\n🔐 Keep your password secure and never share it with anyone.\n" if password else ""
    login_url = "https://mqulima.com/login"

    welcome_msg = (
        f"Welcome to Mqulima, {first_name} 🌱\n"
        f"Your Mqulima account has been created successfully.\n"
        f"{pw_part}\n"
        f"Login: {login_url}\n\n"
        f"Need help? Call Us: +254 723 346 134\n\n"
        f"Mqulima — Smart Farming. Better Decisions."
    )

    return await send_sms(phone, welcome_msg, trigger_type="signup_welcome")
