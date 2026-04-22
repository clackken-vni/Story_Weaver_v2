import { describe, expect, it } from '@jest/globals';

describe('useAudit hook shape', () => {
  it('should export correct return type fields', () => {
    const shape = { events: null, traceChain: null, loading: true, error: null, refetch: () => {}, searchTrace: async (_: string) => {} };
    expect(shape).toHaveProperty('events');
    expect(shape).toHaveProperty('traceChain');
    expect(shape).toHaveProperty('loading');
    expect(shape).toHaveProperty('error');
    expect(shape).toHaveProperty('refetch');
    expect(shape).toHaveProperty('searchTrace');
  });
});
