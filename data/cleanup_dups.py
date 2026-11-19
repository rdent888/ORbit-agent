import sqlite3

conn = sqlite3.connect("data/agy_local.db")
cur = conn.cursor()

# Delete the old short-name IDs (duplicates from earlier fetch)
to_del = [
    "mc-bansosai-agnes-25",
    "mc-bansosai-agnes-30",
    "mc-bansosai-claude-sonnet",
    "mc-bansosai-deepseek",
    "mc-bansosai-qwen",
]

for mid in to_del:
    cur.execute("DELETE FROM model_configs WHERE id=?", (mid,))
    print(f"  deleted: {mid} (rows={cur.rowcount})")

conn.commit()

cur.execute("SELECT COUNT(*) FROM model_configs WHERE provider='bansosai'")
print(f"bansosai models remaining: {cur.fetchone()[0]}")

# Verify no more dups
cur.execute("""
    SELECT model_id, provider, COUNT(*) as cnt
    FROM model_configs
    GROUP BY model_id, provider
    HAVING cnt > 1
""")
dups = cur.fetchall()
if dups:
    print("Still has dups:", dups)
else:
    print("OK: No more duplicates")

conn.close()
