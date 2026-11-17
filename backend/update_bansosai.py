import sqlite3

conn = sqlite3.connect('../data/agy_local.db')
cursor = conn.cursor()

# Delete invalid model 'tes'
cursor.execute('DELETE FROM model_configs WHERE id = ?', ('mc-bansosai-tes',))
cursor.execute('DELETE FROM model_configs WHERE model_id = ?', ('tes',))

real_models = [
    ('mc-bansosai-agnes-30', 'agnes-3.0-flash (BansosAI)', 'bansosai', 'agnes-3.0-flash', 524288, 1, 10),
    ('mc-bansosai-agnes-25', 'agnes-2.5-flash (BansosAI)', 'bansosai', 'agnes-2.5-flash', 524288, 1, 11),
    ('mc-bansosai-claude-sonnet', 'claude-sonnet-4-5 (BansosAI)', 'bansosai', 'claude-sonnet-4-5', 200000, 1, 12),
    ('mc-bansosai-deepseek', 'deepseek-v4-flash (BansosAI)', 'bansosai', 'deepseek-v4-flash', 128000, 1, 13),
    ('mc-bansosai-qwen', 'qwen-3.8-flash (BansosAI)', 'bansosai', 'qwen-3.8-flash', 128000, 1, 14),
]

for m in real_models:
    cursor.execute('''
    INSERT OR REPLACE INTO model_configs (id, display_name, provider, model_id, context_window, is_enabled, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ''', m)

cursor.execute('UPDATE conversations SET model_config_id = ?', ('mc-bansosai-agnes-30',))
conn.commit()

cursor.execute('SELECT id, display_name, provider, model_id FROM model_configs')
for r in cursor.fetchall():
    print(r)
print("SUCCESS!")
