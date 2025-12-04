import struct
from itertools import chain, repeat
import pyodbc
from azure.identity import AzureCliCredential
import json
import sys

FABRIC_SQL = "bkjr54bowwyufnypvcecwxiehm-qneuc2itm7zuzfgvtgon4axdh4.datawarehouse.fabric.microsoft.com"
DB = "Warehouse"

# Build Azure token-based connection
def get_conn():
    token = AzureCliCredential().get_token(
        "https://database.windows.net/.default"
    ).token
    
    token_bytes = token.encode("utf-8")
    encoded = bytes(chain.from_iterable(zip(token_bytes, repeat(0))))
    token_struct = struct.pack("<i", len(encoded)) + encoded
    
    conn_str = (
        "Driver={ODBC Driver 18 for SQL Server};"
        f"Server={FABRIC_SQL},1433;"
        f"Database={DB};"
        "Encrypt=Yes;TrustServerCertificate=No;"
    )

    return pyodbc.connect(conn_str, attrs_before={1256: token_struct})

if __name__ == "__main__":
    startDate = sys.argv[1]
    endDate = sys.argv[2]

    conn = get_conn()
    cur = conn.cursor()

    # Query 1: Sessions > 5 seconds ratio
    sql1 = """
        SELECT 
            SUM(CASE WHEN dwellSeconds > 5 THEN 1 ELSE 0 END) AS longSessions,
            COUNT(*) AS totalSessions,
            (SUM(CASE WHEN dwellSeconds > 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS ratio
        FROM gold_zone.fact_end_session
        WHERE startTime >= ? AND startTime <= ?
    """
    cur.execute(sql1, (startDate, endDate))
    longSessionsResult = cur.fetchone()

    # Query 2: User comeback rate
    sql2 = """
        WITH user_sessions AS (
            SELECT visitorId, COUNT(*) AS sessionCount
            FROM gold_zone.fact_end_session
            WHERE startTime >= ? AND startTime <= ?
            GROUP BY visitorId
        )
        SELECT 
            SUM(CASE WHEN sessionCount >= 2 THEN 1 ELSE 0 END) AS returningUsers,
            COUNT(*) AS totalUsers,
            (SUM(CASE WHEN sessionCount >= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS comebackRate
        FROM user_sessions
    """
    cur.execute(sql2, (startDate, endDate))
    comebackResult = cur.fetchone()

    conn.close()

    output = {
        "longSessionRatio": float(longSessionsResult[2] or 0),
        "comebackRate": float(comebackResult[2] or 0)
    }

    print(json.dumps(output))
