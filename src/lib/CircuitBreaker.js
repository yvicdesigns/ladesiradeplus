class CircuitBreaker {
  constructor() {
    this.failures = new Map();
    this.threshold = 3; // Max failures before opening circuit
    this.cooldown = 10000; // 10 seconds cooldown before half-open
    this.openCircuits = new Map();
    this.errorLogs = new Map(); // For deduplication
  }

  /**
   * Checks if a circuit is open for a given context.
   * If open, throws immediately to prevent further requests.
   */
  check(context) {
    const openUntil = this.openCircuits.get(context);
    if (openUntil) {
      if (Date.now() > openUntil) {
        // Half-open state
        this.openCircuits.delete(context);
        return true; 
      }
      throw new Error(`Circuit open for ${context}. Fast failing to prevent infinite loops.`);
    }
    return true;
  }

  /**
   * Records a failure for a context. Opens circuit if threshold reached.
   */
  recordFailure(context) {
    const currentFailures = (this.failures.get(context) || 0) + 1;
    this.failures.set(context, currentFailures);

    if (currentFailures >= this.threshold) {
      const cooldownUntil = Date.now() + this.cooldown;
      this.openCircuits.set(context, cooldownUntil);
      console.warn(`[CircuitBreaker] Circuit OPENED for ${context}. Cooldown: ${this.cooldown}ms`);
      // Reset failures to allow clean slate after cooldown
      this.failures.delete(context);
    }
  }

  /**
   * Records a success, resetting the failure count for the context.
   */
  recordSuccess(context) {
    this.failures.delete(context);
    this.openCircuits.delete(context);
  }

  /**
   * Deduplicates error logging to prevent console spam
   */
  logErrorDeduped(context, error) {
    const errorKey = `${context}-${error?.message || 'unknown'}`;
    const lastLog = this.errorLogs.get(errorKey);
    const now = Date.now();

    if (!lastLog || now - lastLog > 5000) { // Log at most once per 5 seconds
      console.error(`🚨 [${context}]`, error);
      this.errorLogs.set(errorKey, now);
    }
  }
}

export const globalCircuitBreaker = new CircuitBreaker();