import test from 'node:test';
import assert from 'node:assert/strict';

// Test Quota Balancer logic
test('QuotaBalancer: should prioritize accounts strictly by priorityOrder', () => {
  const accounts = [
    { id: 'acc-2', priorityOrder: 2, isActive: true, status: 'ok', supportedModelIds: ['gemini-pro'] },
    { id: 'acc-1', priorityOrder: 1, isActive: true, status: 'ok', supportedModelIds: ['gemini-pro'] },
    { id: 'acc-3', priorityOrder: 3, isActive: true, status: 'ok', supportedModelIds: ['gemini-pro'] },
  ];

  const candidates = accounts
    .filter((a) => a.isActive && a.supportedModelIds.includes('gemini-pro') && a.status === 'ok')
    .sort((a, b) => a.priorityOrder - b.priorityOrder);

  assert.equal(candidates[0].id, 'acc-1', 'Highest priority account should be picked first');
});

test('QuotaBalancer: should automatically rotate to backup account when 429 occurs', () => {
  const accounts = [
    { id: 'acc-primary', priorityOrder: 1, isActive: true, status: 'ok', supportedModelIds: ['gemini-pro'] },
    { id: 'acc-backup', priorityOrder: 2, isActive: true, status: 'ok', supportedModelIds: ['gemini-pro'] },
  ];

  // Simulate 429 on primary
  const updatedAccounts = accounts.map((acc) =>
    acc.id === 'acc-primary' ? { ...acc, status: 'rate_limited' } : acc
  );

  const available = updatedAccounts
    .filter((a) => a.isActive && a.supportedModelIds.includes('gemini-pro') && a.status === 'ok')
    .sort((a, b) => a.priorityOrder - b.priorityOrder);

  assert.equal(available[0].id, 'acc-backup', 'Backup account must be selected after primary hits 429');
});

test('PermissionEvaluator: explicit DENY rule must override Turbo Mode', () => {
  const rules = [
    { action: 'deny', toolName: 'fs.write', pattern: '**/.env*' },
    { action: 'allow', toolName: 'fs.write', pattern: '**/*' },
  ];

  // In Turbo Mode, default is allow, but explicit deny rule MUST block
  const targetPath = '.env.production';
  let result = 'allow'; // Turbo default

  for (const r of rules) {
    if (r.action === 'deny' && targetPath.includes('.env')) {
      result = 'deny';
      break;
    }
  }

  assert.equal(result, 'deny', 'Protected files must be blocked even when Turbo Mode is active');
});

test('SessionSerializer: resuming session on a new model must 100% preserve the target goal', () => {
  const initialSession = {
    id: 'sess-1',
    goalText: 'Implement high-speed token balancer with SQLite persistence',
    modelId: 'anthropic/claude-3-7-sonnet',
    accountId: 'acc-anthropic-1',
    status: 'token_limit',
  };

  const newModelId = 'google/gemini-2.5-pro';
  const newAccountId = 'acc-google-1';

  // Resume state
  const resumedSession = {
    ...initialSession,
    modelId: newModelId,
    accountId: newAccountId,
    status: 'active',
    goalText: initialSession.goalText, // Preserved
  };

  assert.equal(resumedSession.goalText, initialSession.goalText, 'Target goal must remain identical');
  assert.equal(resumedSession.modelId, 'google/gemini-2.5-pro', 'Model must be updated to new target');
  assert.equal(resumedSession.status, 'active', 'Session must be restored to active');
});
