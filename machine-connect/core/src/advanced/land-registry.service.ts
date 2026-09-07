import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { LandParcel, LandRegistryAnchorProvider, LandTransferRequest } from './land-registry.types';
import { ProvenanceService } from './provenance.service';

@Injectable()
export class LandRegistryService {
  private readonly parcels = new Map<string, LandParcel>();
  private readonly transfers = new Map<string, LandTransferRequest & { id: string; status: 'requested' | 'approved' | 'completed' | 'rejected'; anchorHash?: string }>();

  constructor(private readonly provenance: ProvenanceService, private readonly anchorProvider?: LandRegistryAnchorProvider) {}

  register(parcel: Omit<LandParcel, 'id'>): LandParcel {
    if (!parcel.organizationId || !parcel.parcelId || !parcel.geoJson) throw new Error('invalid parcel');
    const key = `${parcel.organizationId}:${parcel.parcelId}`;
    if ([...this.parcels.values()].some((x) => `${x.organizationId}:${x.parcelId}` === key)) throw new Error('parcel already exists');
    const created = { ...parcel, id: crypto.randomUUID() };
    this.parcels.set(created.id, created);
    return created;
  }

  get(organizationId: string, parcelId: string) {
    return [...this.parcels.values()].find((x) => x.organizationId === organizationId && x.parcelId === parcelId);
  }

  requestTransfer(organizationId: string, input: LandTransferRequest) {
    const parcel = this.get(organizationId, input.parcelId);
    if (!parcel) throw new Error('parcel not found');
    if (!input.toCitizenId || !input.requestedBy || !input.reason.trim() || !input.idempotencyKey) throw new Error('invalid transfer request');
    const id = crypto.randomUUID();
    const request = { ...input, id, status: 'requested' as const };
    this.transfers.set(`${organizationId}:${input.idempotencyKey}`, request);
    return request;
  }

  async anchorParcel(organizationId: string, parcelId: string) {
    const parcel = this.get(organizationId, parcelId);
    if (!parcel) throw new Error('parcel not found');
    if (!this.anchorProvider) throw new Error('anchor provider is not configured');
    return this.anchorProvider.anchor(this.provenance.hash(parcel));
  }
}
