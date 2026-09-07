export interface LandParcel {
  id: string;
  organizationId: string;
  parcelId: string;
  ownerCitizenId?: string;
  geoJson: Record<string, unknown>;
  areaSqm?: number;
  status: 'active' | 'pending' | 'disputed' | 'inactive';
}

export interface LandTransferRequest {
  parcelId: string;
  fromCitizenId?: string;
  toCitizenId: string;
  requestedBy: string;
  reason: string;
  idempotencyKey: string;
}

export interface LandAnchor {
  provider: string;
  externalReference: string;
  contentHash: string;
  anchoredAt: string;
}

export interface LandRegistryAnchorProvider {
  anchor(contentHash: string): Promise<LandAnchor>;
}
