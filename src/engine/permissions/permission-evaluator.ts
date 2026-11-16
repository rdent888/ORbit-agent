import { PermissionRule } from '../../types';

export class PermissionEvaluator {
  /**
   * Simple glob pattern matcher (*, **, file paths)
   */
  private static matchesGlob(pattern: string, targetPath: string): boolean {
    if (pattern === '*' || pattern === '**/*') return true;
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp(`^${regexPattern}$`).test(targetPath);
  }

  /**
   * Deterministic evaluation of permissions
   */
  static evaluate(
    rules: PermissionRule[],
    toolName: string,
    targetPath: string,
    turboMode: boolean
  ): 'allow' | 'deny' | 'ask' {
    // 1. Check explicit DENY rules first
    for (const rule of rules) {
      if (rule.action === 'deny' && (rule.toolName === toolName || rule.toolName === '*')) {
        if (this.matchesGlob(rule.pattern, targetPath)) {
          return 'deny';
        }
      }
    }

    // 2. Check explicit ALLOW rules
    for (const rule of rules) {
      if (rule.action === 'allow' && (rule.toolName === toolName || rule.toolName === '*')) {
        if (this.matchesGlob(rule.pattern, targetPath)) {
          return 'allow';
        }
      }
    }

    // 3. Check explicit ASK rules
    for (const rule of rules) {
      if (rule.action === 'ask' && (rule.toolName === toolName || rule.toolName === '*')) {
        if (this.matchesGlob(rule.pattern, targetPath)) {
          return 'ask';
        }
      }
    }

    // 4. Default fallback: Turbo Mode allows all operations, standard asks
    return turboMode ? 'allow' : 'ask';
  }
}
