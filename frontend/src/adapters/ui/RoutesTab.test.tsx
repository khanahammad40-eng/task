import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutesTab } from './RoutesTab';
import { api } from '../infrastructure/api-client-adapter';

vi.mock('../infrastructure/api-client-adapter', () => ({
  api: {
    getRoutes: vi.fn(),
    setBaseline: vi.fn(),
  },
}));

describe('RoutesTab', () => {
  beforeEach(() => {
    vi.mocked(api.getRoutes).mockResolvedValue([
      {
        id: '1',
        routeId: 'R001',
        vesselType: 'Container',
        fuelType: 'HFO',
        year: 2024,
        ghgIntensity: 91,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: true,
      },
    ]);
  });

  it('loads and displays routes', async () => {
    render(<RoutesTab />);
    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
  });
});
