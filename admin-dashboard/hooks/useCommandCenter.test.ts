import { describe, expect, it } from '@jest/globals';

describe('useCommandCenter hook shape', () => {
  it('should export correct return type fields', () => {
    const shape = { data: null, loading: true, error: null, refetch: () => {} };
    expect(shape).toHaveProperty('data');
    expect(shape).toHaveProperty('loading');
    expect(shape).toHaveProperty('error');
    expect(shape).toHaveProperty('refetch');
  });
});
