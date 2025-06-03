/**
 * Graceful Degradation Utilities
 * 
 * Provides fallback mechanisms and mock data when services are unavailable,
 * allowing the application to continue functioning in a degraded state.
 */

import { logError, ErrorSeverity, AppError } from './errorLogger';

export interface ServiceStatus {
  available: boolean;
  lastChecked: number;
  errorCount: number;
  lastError?: string;
}

export interface DegradationConfig {
  enableMockData: boolean;
  showDegradationWarning: boolean;
  autoRetryInterval: number; // milliseconds
  maxRetryAttempts: number;
}

export interface MockDataOptions {
  includeRandomization: boolean;
  responseDelay: number; // milliseconds to simulate network delay
  successRate: number; // 0-1, chance of successful mock response
}

class GracefulDegradationManager {
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private mockDataGenerators: Map<string, (...args: any[]) => any> = new Map();
  private config: DegradationConfig = {
    enableMockData: true,
    showDegradationWarning: true,
    autoRetryInterval: 30000, // 30 seconds
    maxRetryAttempts: 5
  };

  /**
   * Register a service and its mock data generator
   */
  registerService(
    serviceName: string, 
    mockDataGenerator: (...args: any[]) => any,
    initialStatus: Partial<ServiceStatus> = {}
  ): void {
    this.serviceStatuses.set(serviceName, {
      available: true,
      lastChecked: Date.now(),
      errorCount: 0,
      ...initialStatus
    });
    
    this.mockDataGenerators.set(serviceName, mockDataGenerator);
    
    logError(
      new AppError(
        `Service registered for graceful degradation: ${serviceName}`,
        'SERVICE_REGISTERED',
        ErrorSeverity.INFO,
        { serviceName },
        false
      ),
      {
        message: 'Service registered for degradation handling',
        context: { serviceName },
        tags: ['degradation', 'service-registration']
      },
      ErrorSeverity.INFO
    );
  }

  /**
   * Mark a service as unavailable
   */
  markServiceUnavailable(serviceName: string, error?: Error): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.available = false;
      status.lastChecked = Date.now();
      status.errorCount += 1;
      status.lastError = error?.message;
      
      logError(
        error || new AppError(
          `Service marked as unavailable: ${serviceName}`,
          'SERVICE_UNAVAILABLE',
          ErrorSeverity.WARNING,
          { serviceName, errorCount: status.errorCount },
          false
        ),
        {
          message: 'Service marked as unavailable',
          context: { 
            serviceName, 
            errorCount: status.errorCount,
            willUseMockData: this.config.enableMockData 
          },
          tags: ['degradation', 'service-unavailable']
        },
        ErrorSeverity.WARNING
      );
    }
  }

  /**
   * Mark a service as available
   */
  markServiceAvailable(serviceName: string): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      const wasUnavailable = !status.available;
      status.available = true;
      status.lastChecked = Date.now();
      status.errorCount = 0;
      status.lastError = undefined;
      
      if (wasUnavailable) {
        logError(
          new AppError(
            `Service recovered: ${serviceName}`,
            'SERVICE_RECOVERED',
            ErrorSeverity.INFO,
            { serviceName },
            false
          ),
          {
            message: 'Service has recovered and is now available',
            context: { serviceName },
            tags: ['degradation', 'service-recovery']
          },
          ErrorSeverity.INFO
        );
      }
    }
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.available ?? false;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Execute a function with degradation fallback
   */
  async executeWithFallback<T>(
    serviceName: string,
    primaryFunction: () => Promise<T>,
    fallbackArgs?: any[],
    options: Partial<MockDataOptions> = {}
  ): Promise<T> {
    const mockOptions: MockDataOptions = {
      includeRandomization: true,
      responseDelay: 500,
      successRate: 1.0,
      ...options
    };

    // Check if service is available
    if (!this.isServiceAvailable(serviceName)) {
      return this.useFallback(serviceName, fallbackArgs, mockOptions);
    }

    try {
      const result = await primaryFunction();
      this.markServiceAvailable(serviceName);
      return result;
    } catch (error) {
      this.markServiceUnavailable(serviceName, error instanceof Error ? error : new Error(String(error)));
      return this.useFallback(serviceName, fallbackArgs, mockOptions);
    }
  }

  /**
   * Use fallback/mock data for a service
   */
  private async useFallback<T>(
    serviceName: string, 
    args: any[] = [], 
    options: MockDataOptions
  ): Promise<T> {
    if (!this.config.enableMockData) {
      throw new AppError(
        `Service ${serviceName} is unavailable and mock data is disabled`,
        'SERVICE_UNAVAILABLE_NO_MOCK',
        ErrorSeverity.ERROR,
        { serviceName },
        false
      );
    }

    const generator = this.mockDataGenerators.get(serviceName);
    if (!generator) {
      throw new AppError(
        `No mock data generator found for service: ${serviceName}`,
        'NO_MOCK_GENERATOR',
        ErrorSeverity.ERROR,
        { serviceName },
        false
      );
    }

    // Simulate network delay
    if (options.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, options.responseDelay));
    }

    // Simulate occasional failures even in mock mode
    if (Math.random() > options.successRate) {
      throw new AppError(
        `Mock service failure simulation for ${serviceName}`,
        'MOCK_FAILURE_SIMULATION',
        ErrorSeverity.WARNING,
        { serviceName },
        false
      );
    }

    const mockData = generator(...args);
    
    logError(
      new AppError(
        `Using mock data for ${serviceName}`,
        'USING_MOCK_DATA',
        ErrorSeverity.INFO,
        { serviceName, mockDataUsed: true },
        false
      ),
      {
        message: 'Fallback to mock data due to service unavailability',
        context: { serviceName, args: args.length },
        tags: ['degradation', 'mock-data', serviceName]
      },
      ErrorSeverity.INFO
    );

    return mockData;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalServices: number;
    availableServices: number;
    unavailableServices: number;
    healthPercentage: number;
    serviceDetails: Array<{ name: string; status: ServiceStatus }>;
  } {
    const services = Array.from(this.serviceStatuses.entries());
    const availableCount = services.filter(([_, status]) => status.available).length;
    
    return {
      totalServices: services.length,
      availableServices: availableCount,
      unavailableServices: services.length - availableCount,
      healthPercentage: services.length > 0 ? (availableCount / services.length) * 100 : 100,
      serviceDetails: services.map(([name, status]) => ({ name, status }))
    };
  }

  /**
   * Configure degradation behavior
   */
  configure(config: Partial<DegradationConfig>): void {
    this.config = { ...this.config, ...config };
    
    logError(
      new AppError(
        'Graceful degradation configuration updated',
        'DEGRADATION_CONFIG_UPDATED',
        ErrorSeverity.INFO,
        { config: this.config },
        false
      ),
      {
        message: 'Degradation manager configuration updated',
        context: { newConfig: config },
        tags: ['degradation', 'configuration']
      },
      ErrorSeverity.INFO
    );
  }

  /**
   * Start automatic health checking
   */
  startHealthMonitoring(): void {
    const checkHealth = () => {
      const health = this.getSystemHealth();
      
      if (health.healthPercentage < 100) {
        logError(
          new AppError(
            `System health check: ${health.healthPercentage.toFixed(1)}%`,
            'SYSTEM_HEALTH_CHECK',
            health.healthPercentage < 50 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
            health,
            false
          ),
          {
            message: 'Periodic system health check',
            context: health,
            tags: ['degradation', 'health-check']
          },
          health.healthPercentage < 50 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING
        );
      }
    };

    // Initial check
    checkHealth();
    
    // Set up periodic checking
    setInterval(checkHealth, this.config.autoRetryInterval);
  }

  /**
   * Get degradation status for UI display
   */
  getDegradationStatus(): {
    isDegraded: boolean;
    affectedServices: string[];
    message: string;
    severity: 'info' | 'warning' | 'error';
  } {
    const health = this.getSystemHealth();
    const affectedServices = health.serviceDetails
      .filter(({ status }) => !status.available)
      .map(({ name }) => name);

    if (affectedServices.length === 0) {
      return {
        isDegraded: false,
        affectedServices: [],
        message: 'All services are operational',
        severity: 'info'
      };
    }

    const severity = health.healthPercentage < 50 ? 'error' : 'warning';
    const message = affectedServices.length === 1 
      ? `${affectedServices[0]} service is temporarily unavailable. Using cached data.`
      : `${affectedServices.length} services are temporarily unavailable. Using cached data.`;

    return {
      isDegraded: true,
      affectedServices,
      message,
      severity
    };
  }
}

// Global instance
export const degradationManager = new GracefulDegradationManager();

// Mock data generators for common services
export const mockGenerators = {
  openai: {
    chatCompletion: (messages: any[]) => ({
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo-mock',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mock response from OpenAI. The actual service is currently unavailable.'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    }),
    
    streamingCompletion: function* (messages: any[]) {
      const words = 'This is a mock streaming response from OpenAI. The actual service is currently unavailable.'.split(' ');
      for (const word of words) {
        yield {
          id: `mock-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-3.5-turbo-mock',
          choices: [{
            index: 0,
            delta: { content: word + ' ' },
            finish_reason: null
          }]
        };
      }
    }
  },

  stripe: {
    createCheckoutSession: (params: any) => ({
      id: `cs_mock_${Date.now()}`,
      object: 'checkout.session',
      url: `https://checkout.stripe.com/mock-session-${Date.now()}`,
      payment_status: 'unpaid',
      status: 'open'
    }),
    
    retrieveCustomer: (customerId: string) => ({
      id: customerId,
      object: 'customer',
      email: 'mock@example.com',
      created: Math.floor(Date.now() / 1000),
      subscriptions: {
        data: [],
        has_more: false
      }
    })
  },

  mongodb: {
    findUser: (userId: string) => ({
      _id: userId,
      email: 'mock@example.com',
      createdAt: new Date(),
      subscription: {
        status: 'trial',
        plan: 'free'
      }
    }),
    
    saveChat: (chatData: any) => ({
      _id: `mock_${Date.now()}`,
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
};

// Initialize common services
export function initializeGracefulDegradation(): void {
  // Register OpenAI service
  degradationManager.registerService('openai', mockGenerators.openai.chatCompletion);
  
  // Register Stripe service
  degradationManager.registerService('stripe', mockGenerators.stripe.createCheckoutSession);
  
  // Register MongoDB service
  degradationManager.registerService('mongodb', mockGenerators.mongodb.findUser);
  
  // Start health monitoring
  degradationManager.startHealthMonitoring();
  
  logError(
    new AppError(
      'Graceful degradation system initialized',
      'DEGRADATION_INITIALIZED',
      ErrorSeverity.INFO,
      { servicesRegistered: 3 },
      false
    ),
    {
      message: 'Graceful degradation system ready',
      context: { servicesRegistered: ['openai', 'stripe', 'mongodb'] },
      tags: ['degradation', 'initialization']
    },
    ErrorSeverity.INFO
  );
}

export default {
  degradationManager,
  mockGenerators,
  initializeGracefulDegradation
};