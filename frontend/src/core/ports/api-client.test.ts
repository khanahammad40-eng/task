import { createApiClient } from './api-client';

describe('createApiClient', () => {
  it('exposes getRoutes, setBaseline, getComparison, getCb, getAdjustedCb, bank, apply, createPool', () => {
    const client = createApiClient();
    expect(typeof client.getRoutes).toBe('function');
    expect(typeof client.setBaseline).toBe('function');
    expect(typeof client.getComparison).toBe('function');
    expect(typeof client.getCb).toBe('function');
    expect(typeof client.getAdjustedCb).toBe('function');
    expect(typeof client.bank).toBe('function');
    expect(typeof client.apply).toBe('function');
    expect(typeof client.createPool).toBe('function');
  });
});
