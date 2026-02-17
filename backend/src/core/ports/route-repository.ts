import type { Route } from '../domain/route';

export interface RouteRepository {
  findAll(): Promise<Route[]>;
  findByRouteId(routeId: string): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
}
