export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface RouteComparison {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  baselineGhgIntensity: number;
  comparisonGhgIntensity: number;
  percentDiff: number;
  compliant: boolean;
}
