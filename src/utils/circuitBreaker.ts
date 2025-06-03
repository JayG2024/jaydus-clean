/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by monitoring service health and 
 * temporarily disabling calls to failing services.
 */

import { logError, ErrorSeverity, AppError } from './errorLogger';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit breaker is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed to close circuit in half-open state
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  failureRate: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private recentFailures: number[] = [];

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3
    }
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should be closed due to recovery timeout
    if (this.state === CircuitState.OPEN && this.shouldAttemptRecovery()) {
      this.state = CircuitState.HALF_OPEN;
      this.successes = 0;
      logError(
        new AppError(
          `Circuit breaker for ${this.serviceName} moved to HALF_OPEN`,
          'CIRCUIT_BREAKER_HALF_OPEN',
          ErrorSeverity.INFO,
          { service: this.serviceName },
          false
        ),
        {
          message: 'Circuit breaker attempting recovery',
          context: { service: this.serviceName, previousState: 'OPEN' },
          tags: ['circuit-breaker', 'recovery']
        },
        ErrorSeverity.INFO
      );
    }

    // Fail fast if circuit is open
    if (this.state === CircuitState.OPEN) {
      const error = new AppError(
        `Circuit breaker is OPEN for ${this.serviceName}`,
        'CIRCUIT_BREAKER_OPEN',
        ErrorSeverity.WARNING,
        { service: this.serviceName },
        false
      );

      if (fallback) {
        logError(error, {
          message: 'Circuit breaker open, using fallback',
          context: { service: this.serviceName },
          tags: ['circuit-breaker', 'fallback']
        }, ErrorSeverity.INFO);
        return await fallback();
      }

      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      // If we have a fallback and circuit is open, use it
      if (fallback && this.state === CircuitState.OPEN) {
        logError(
          error instanceof Error ? error : new Error('Unknown error'),
          {
            message: 'Function failed, circuit opened, using fallback',
            context: { service: this.serviceName },
            tags: ['circuit-breaker', 'fallback', 'error']
          },
          ErrorSeverity.WARNING
        );
        return await fallback();
      }

      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      // Close circuit if enough successes
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.recentFailures = [];
        
        logError(
          new AppError(
            `Circuit breaker for ${this.serviceName} CLOSED after recovery`,
            'CIRCUIT_BREAKER_CLOSED',
            ErrorSeverity.INFO,
            { service: this.serviceName, successCount: this.successes },
            false
          ),
          {
            message: 'Circuit breaker closed after successful recovery',
            context: { service: this.serviceName, successCount: this.successes },
            tags: ['circuit-breaker', 'recovery', 'success']
          },
          ErrorSeverity.INFO
        );
      }
    }
  }

  /**
   * Record a failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.recentFailures.push(Date.now());
    
    // Clean old failures outside monitoring period
    this.cleanOldFailures();
    
    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED && this.shouldOpenCircuit()) {
      this.state = CircuitState.OPEN;
      
      logError(
        new AppError(
          `Circuit breaker OPENED for ${this.serviceName}`,
          'CIRCUIT_BREAKER_OPENED',
          ErrorSeverity.ERROR,
          { 
            service: this.serviceName, 
            failures: this.failures,
            recentFailures: this.recentFailures.length,
            threshold: this.config.failureThreshold
          },
          false
        ),
        {
          message: 'Circuit breaker opened due to repeated failures',
          context: { 
            service: this.serviceName, 
            failureCount: this.recentFailures.length,
            threshold: this.config.failureThreshold
          },
          tags: ['circuit-breaker', 'failure', 'opened']
        },
        ErrorSeverity.ERROR
      );
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Failed in half-open state, go back to open
      this.state = CircuitState.OPEN;
      this.successes = 0;
      
      logError(
        new AppError(
          `Circuit breaker for ${this.serviceName} failed in HALF_OPEN, returning to OPEN`,
          'CIRCUIT_BREAKER_RECOVERY_FAILED',
          ErrorSeverity.WARNING,
          { service: this.serviceName },
          false
        ),
        {
          message: 'Circuit breaker recovery failed, returning to OPEN state',
          context: { service: this.serviceName },
          tags: ['circuit-breaker', 'recovery-failed']
        },
        ErrorSeverity.WARNING
      );
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    return this.recentFailures.length >= this.config.failureThreshold;
  }

  /**
   * Check if we should attempt recovery
   */
  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Clean failures outside the monitoring period
   */
  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.recentFailures = this.recentFailures.filter(time => time > cutoff);
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanOldFailures();
    
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      failureRate: this.totalRequests > 0 ? this.recentFailures.length / this.totalRequests : 0
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.recentFailures = [];
    this.totalRequests = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;

    logError(
      new AppError(
        `Circuit breaker for ${this.serviceName} manually reset`,
        'CIRCUIT_BREAKER_RESET',
        ErrorSeverity.INFO,
        { service: this.serviceName },
        false
      ),
      {
        message: 'Circuit breaker manually reset',
        context: { service: this.serviceName },
        tags: ['circuit-breaker', 'manual-reset']
      },
      ErrorSeverity.INFO
    );
  }

  /**
   * Check if the circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, CircuitBreakerStats> {
    const status: Record<string, CircuitBreakerStats> = {};
    
    for (const [serviceName, breaker] of this.breakers.entries()) {
      status[serviceName] = breaker.getStats();
    }
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Check if any services are unhealthy
   */
  hasUnhealthyServices(): boolean {
    return Array.from(this.breakers.values()).some(breaker => !breaker.isHealthy());
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

export default {
  CircuitBreaker,
  CircuitBreakerManager,
  circuitBreakerManager,
  CircuitState
};