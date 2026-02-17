export interface PoolMemberAllocation {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface CreatePoolCommand {
  year: number;
  memberShipIds: string[];
}

export interface CreatePoolResult {
  poolId: string;
  year: number;
  members: PoolMemberAllocation[];
}
