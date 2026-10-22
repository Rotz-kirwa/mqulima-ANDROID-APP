from pathlib import Path

from dotenv import dotenv_values
from pymongo import MongoClient


def main() -> None:
    env = dotenv_values("/app/backend/.env")
    mongo_url = env.get("MONGO_URL")
    db_name = env.get("DB_NAME")
    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME missing")

    client = MongoClient(mongo_url)
    db = client[db_name]

    # Cleanup forum test data from this and prior baseline runs.
    thread_res = db.threads.delete_many(
        {
            "$or": [
                {"text": {"$regex": "TEST BASELINE", "$options": "i"}},
                {"text": {"$regex": "TEST_UI_BASELINE", "$options": "i"}},
            ]
        }
    )
    comment_res = db.threads.update_many(
        {},
        {
            "$pull": {
                "comments": {"text": {"$regex": "TEST_UI_BASELINE|TEST baseline comment", "$options": "i"}}
            }
        },
    )

    # Capture latest created test credentials for audit trail.
    latest = db.users.find_one(
        {"email": {"$regex": "^TEST_baseline_", "$options": "i"}},
        {"_id": 0, "email": 1, "name": 1, "county": 1},
        sort=[("created_at", -1)],
    )

    creds_path = Path("/app/memory/test_credentials.md")
    existing = creds_path.read_text() if creds_path.exists() else "# Test Credentials\n\n"
    append = "\n## Baseline test credentials created (2026-10-22)\n"
    if latest:
        append += f"- Email: {latest.get('email')}\n"
        append += "- Password: secret123\n"
        append += f"- Name: {latest.get('name', 'TEST Baseline Farmer')}\n"
        append += f"- County: {latest.get('county', 'Nairobi')}\n"
    else:
        append += "- No TEST_baseline_ user found in DB after run.\n"

    append += f"- Forum cleanup: deleted_threads={thread_res.deleted_count}, updated_threads={comment_res.modified_count}\n"
    creds_path.write_text(existing.rstrip() + "\n" + append)

    client.close()
    print(
        f"cleanup_complete deleted_threads={thread_res.deleted_count} updated_threads={comment_res.modified_count} latest_user={latest.get('email') if latest else 'none'}"
    )


if __name__ == "__main__":
    main()
