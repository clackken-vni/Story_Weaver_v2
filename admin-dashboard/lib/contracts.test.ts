import { describe, expect, it } from '@jest/globals';
import { CommandCenterSummaryResponse } from './contracts';

describe('contracts', () => {
  it('matches command center response shape', () => {
    const response: CommandCenterSummaryResponse = {
      success: true,
      data: {
        open_incidents: 2,
        degraded_services: 1,
        top_alerts: ['ai timeout'],
      },
      meta: { version: 'v1' },
    };

    expect(response.data.open_incidents).toBe(2);
    expect(response.data.degraded_services).toBe(1);
  });
});
