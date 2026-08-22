# =========================================
# FILE: init_db.py
# =========================================

from database import get_db_connection

CREATE_VENDORS = """
CREATE TABLE IF NOT EXISTS vendors (
    vendor_gstin    VARCHAR(15) PRIMARY KEY CHECK (LENGTH(vendor_gstin) = 15),
    vendor_name     VARCHAR(150) NOT NULL,
    state_code      VARCHAR(2) NOT NULL,
    risk_score      INT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""

CREATE_PURCHASE_LEDGERS = """
CREATE TABLE IF NOT EXISTS purchase_ledgers (
    invoice_id      VARCHAR(50) PRIMARY KEY,
    vendor_gstin    VARCHAR(15) NOT NULL REFERENCES vendors(vendor_gstin) ON DELETE RESTRICT,
    base_amount     NUMERIC(12,2) NOT NULL,
    tax_amount      NUMERIC(12,2) NOT NULL,
    total_amount    NUMERIC(12,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'APPROVED', 'FLAGGED', 'MANUAL_REVIEW')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""

CREATE_BANK_TRANSACTIONS = """
CREATE TABLE IF NOT EXISTS bank_transactions (
    transaction_id  SERIAL PRIMARY KEY,
    vendor_gstin    VARCHAR(15) NOT NULL REFERENCES vendors(vendor_gstin) ON DELETE RESTRICT,
    amount_paid     NUMERIC(12,2) NOT NULL,
    payment_date    DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""

CREATE_AI_AUDIT_LOGS = """
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    log_id          SERIAL PRIMARY KEY,
    invoice_id      VARCHAR(50) NOT NULL,
    agent_name      VARCHAR(50) NOT NULL,
    action_taken    VARCHAR(50) NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""


def create_tables(cursor) -> None:
    print("Creating table: vendors ...")
    cursor.execute(CREATE_VENDORS)

    print("Creating table: purchase_ledgers ...")
    cursor.execute(CREATE_PURCHASE_LEDGERS)

    print("Creating table: bank_transactions ...")
    cursor.execute(CREATE_BANK_TRANSACTIONS)

    print("Creating table: ai_audit_logs ...")
    cursor.execute(CREATE_AI_AUDIT_LOGS)


def seed_dummy_data(cursor) -> None:
    """
    Inserts the 'Ground Truth' Dell India test record, but only if the
    vendors table is currently empty. This keeps the script idempotent —
    safe to re-run without duplicating data.
    """
    cursor.execute("SELECT COUNT(*) AS count FROM vendors;")
    row = cursor.fetchone()

    if row["count"] > 0:
        print("Dummy data already present. Skipping seed.")
        return

    print("Seeding dummy 'Ground Truth' data for Dell India Pvt Ltd ...")

    cursor.execute(
        """
        INSERT INTO vendors (vendor_gstin, vendor_name, state_code, risk_score)
        VALUES (%s, %s, %s, %s);
        """,
        ("27AADCB2230M1Z2", "Dell India Pvt Ltd", "27", 10)
    )

    cursor.execute(
        """
        INSERT INTO purchase_ledgers (invoice_id, vendor_gstin, base_amount, tax_amount, total_amount, status)
        VALUES (%s, %s, %s, %s, %s, %s);
        """,
        ("INV-2026-001", "27AADCB2230M1Z2", 50000.00, 9000.00, 59000.00, "PENDING")
    )

    cursor.execute(
        """
        INSERT INTO bank_transactions (vendor_gstin, amount_paid, payment_date)
        VALUES (%s, %s, CURRENT_DATE);
        """,
        ("27AADCB2230M1Z2", 59000.00)
    )

    print("Seed complete: 1 vendor, 1 ledger entry, 1 bank transaction inserted.")


def main() -> None:
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        create_tables(cursor)
        conn.commit()
        print("All tables created successfully.\n")

        seed_dummy_data(cursor)
        conn.commit()
        print("\nDatabase initialization complete.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[init_db] FAILED: {str(e)}")
        raise

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    main()