import CircuitBreaker from 'opossum';

export function createCircuitBreaker(fn: (...args: any[]) => Promise<any>) {
  return new CircuitBreaker(fn, {
    timeout: 5000, // 5s
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30s
  });
}
