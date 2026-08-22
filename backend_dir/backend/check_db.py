import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    print(f"\nConnecting to: {os.getenv('NEON_DATABASE_URL')[:40]}...") # Half URL to verify
    conn = psycopg2.connect(os.getenv("NEON_DATABASE_URL"))
    cursor = conn.cursor()
    
    cursor.execute("SELECT invoice_id, vendor_gstin, total_amount FROM purchase_ledgers;")
    rows = cursor.fetchall()
    
    print("\n[DB TRUTH SERUM] Your python backend sees these records:")
    if not rows:
        print("-> THE TABLE IS COMPLETELY EMPTY!")
    else:
        for row in rows:
            print(f"-> Invoice: '{row[0]}' | GSTIN: '{row[1]}' | Amount: {row[2]}")
            
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")