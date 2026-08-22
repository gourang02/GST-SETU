# =========================================
# FILE: database.py
# =========================================

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL")
if not NEON_DATABASE_URL:
    raise ValueError("NEON_DATABASE_URL not found in environment variables.")


def get_db_connection():
    """
    Returns a new psycopg2 connection to the Neon PostgreSQL database,
    configured to return rows as dict-like objects (RealDictRow).
    Caller is responsible for closing the connection.
    """
    try:
        conn = psycopg2.connect(
            NEON_DATABASE_URL,
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        return conn
    except psycopg2.OperationalError as e:
        raise ConnectionError(f"Failed to connect to Neon DB: {str(e)}")


def log_ai_action(invoice_id: str, agent_name: str, action_taken: str, reason: str) -> None:
    """
    Inserts a record into the ai_audit_logs table, capturing which agent
    took what action and why. This is the liability/audit-trail mechanism.

    Args:
        invoice_id: The invoice this log entry relates to.
        agent_name: e.g. 'Agent1_Vision', 'Agent2_Ledger', 'Agent3_Tax'.
        action_taken: e.g. 'EXTRACTED', 'VALIDATED', 'FLAGGED', 'APPROVED'.
        reason: Human-readable explanation of the decision.
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO ai_audit_logs (invoice_id, agent_name, action_taken, reason)
            VALUES (%s, %s, %s, %s);
            """,
            (invoice_id, agent_name, action_taken, reason)
        )
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        # Logging failures should not silently disappear, but they also
        # should not crash the calling agent's core logic.
        print(f"[log_ai_action] Failed to write audit log for {invoice_id}: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()