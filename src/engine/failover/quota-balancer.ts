import { Account } from '../../types';

export class QuotaBalancer {
  /**
   * Selects the optimal account from the pool based on priority and health.
   */
  static getNextAvailableAccount(
    accounts: Account[],
    modelId: string,
    currentAccountId?: string
  ): Account | null {
    const candidates = accounts
      .filter((a) => a.isActive && a.supportedModelIds.includes(modelId) && a.status === 'ok')
      .sort((a, b) => a.priorityOrder - b.priorityOrder);

    if (candidates.length === 0) return null;

    // If current account is still fine, keep it
    if (currentAccountId) {
      const current = candidates.find((a) => a.id === currentAccountId);
      if (current) return current;
    }

    // Return highest priority available account
    return candidates[0];
  }

  /**
   * Handles a 429 error by marking the current account as rate_limited
   * and providing the next backup account in the pool.
   */
  static handleRateLimit(
    accounts: Account[],
    failingAccountId: string,
    modelId: string,
    retryAfterSeconds: number = 60
  ): {
    updatedAccounts: Account[];
    nextAccount: Account | null;
  } {
    const resetTime = new Date(Date.now() + retryAfterSeconds * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === failingAccountId) {
        return {
          ...acc,
          status: 'rate_limited' as const,
          quotaResetAt: `Resets at ${resetTime}`,
        };
      }
      return acc;
    });

    const nextAccount = this.getNextAvailableAccount(updatedAccounts, modelId, undefined);

    return { updatedAccounts, nextAccount };
  }
}
