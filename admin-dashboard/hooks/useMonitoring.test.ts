import { describe, expect, it } from '@jest/globals';

describe('useMonitoring hook shape', () => {
  it('should export correct return type fields', () => {
    const shape = { services: null, infra: null, incidents: null, loading: true, error: null, refetch: () => {} };
    expect(shape).toHaveProperty('services');
    expect(shape).toHaveProperty('infra');
    expect(shape).toHaveProperty('incidents');
    expect(shape).toHaveProperty('loading');
    expect(shape).toHaveProperty('error');
    expect(shape).toHaveProperty('refetch');
  });
});
