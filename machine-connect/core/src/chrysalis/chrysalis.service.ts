import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MachineService } from '../machine/machine.service';
import { SupabaseRest } from '../persistence/supabase-rest';
import { Principal } from '../auth/principal';
import { AssessChrysalisDto, ExecuteChrysalisDto, VerifyChrysalisDto, ChrysalisStrategy } from './chrysalis.dto';

type CapabilityRow = { capability_key: string; category: string; description?: string };
type CompatibilityRow = {
  id: string;
  capability_needed: string;
  strategy: ChrysalisStrategy;
  recommended_upgrade: string;
  constraints: Record<string, unknown>;
  verified: boolean;
  manufacturer_pattern?: string | null;
  model_pattern?: string | null;
};

@Injectable()
export class ChrysalisService {
  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService) {}

  async assessDevice(dto: AssessChrysalisDto, principal: Principal) {
    const machine = await this.machines.get(principal.tenantId, dto.machineId);
    const current = this.normalizeCapabilities(dto.currentCapabilities ?? machine.capabilities);
    const desired = this.normalizeCapabilities(dto.desiredCapabilities);
    if (!desired.length) throw new BadRequestException('At least one desired capability is required');

    const missing = desired.filter((capability) => !current.includes(capability));
    const manufacturer = dto.manufacturer ?? machine.manufacturer ?? undefined;
    const model = dto.model ?? machine.model ?? undefined;
    const year = dto.yearManufactured;

    if (!this.db.enabled) {
      return { assessment: this.localAssessment(principal, machine, current, desired, missing, manufacturer, model, year, dto.evidence), recommendations: this.buildFallbackRecommendations(missing) };
    }

    const capabilities = await this.db.request<CapabilityRow[]>('machine_connect_capability_catalog?active=eq.true&select=capability_key,category,description');
    const validKeys = new Set(capabilities.map((row) => row.capability_key));
    const unknownDesired = desired.filter((key) => !validKeys.has(key));
    if (unknownDesired.length) throw new BadRequestException(`Unknown capabilities: ${unknownDesired.join(', ')}`);

    const assessmentRows = await this.db.request<any[]>('machine_connect_legacy_assessments', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(), organization_id: principal.tenantId, machine_id: machine.id,
        manufacturer, model, year_manufactured: year, current_capabilities: current,
        desired_capabilities: desired, missing_capabilities: missing,
        assessed_by: principal.actorId, evidence: dto.evidence ?? {}, assessment_status: 'completed',
      }),
    });
    const assessment = assessmentRows[0];
    const matrix = await this.db.request<CompatibilityRow[]>('machine_connect_compatibility_matrix?select=*&order=created_at.desc');
    const recommendations = this.buildRecommendations(matrix, missing, manufacturer, model);

    for (const recommendation of recommendations) {
      await this.db.request('machine_connect_upgrade_paths', {
        method: 'POST',
        body: JSON.stringify({
          id: recommendation.id, assessment_id: assessment.id, organization_id: principal.tenantId,
          strategy: recommendation.strategy, title: recommendation.title, description: recommendation.description,
          required_parts: recommendation.requiredParts, complexity: recommendation.complexity,
          estimated_cost: recommendation.estimatedCost, estimated_time_interval: recommendation.estimatedTime,
          instructions: recommendation.instructions, constraints: recommendation.constraints,
          safety_class: recommendation.safetyClass, recommendation_confidence: recommendation.confidence,
        }),
      });
    }

    return { assessment, recommendations };
  }

  async executeUpgrade(dto: ExecuteChrysalisDto, principal: Principal) {
    if (!this.db.enabled) throw new BadRequestException('Persistent Machine Connect storage is required for upgrade preparation');
    const rows = await this.db.request<any[]>(`machine_connect_upgrade_paths?id=eq.${encodeURIComponent(dto.upgradePathId)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Upgrade path not found');
    const path = rows[0];
    if (path.status !== 'recommended' && path.status !== 'selected') throw new BadRequestException('Upgrade path is not executable');

    const assessmentRows = await this.db.request<any[]>(`machine_connect_legacy_assessments?id=eq.${encodeURIComponent(path.assessment_id)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}&limit=1`);
    if (!assessmentRows.length) throw new NotFoundException('Assessment not found');
    const assessment = assessmentRows[0];

    const rowsCreated = await this.db.request<any[]>('machine_connect_installed_upgrades', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(), upgrade_path_id: path.id, organization_id: principal.tenantId,
        machine_id: assessment.machine_id, status: 'awaiting_installation', verification_status: 'pending',
        resulting_capabilities: [...new Set([...(assessment.current_capabilities ?? []), ...(assessment.missing_capabilities ?? [])])],
        adapter_recommendations: this.adapterRecommendations(path),
        notes: dto.notes ?? null,
        metadata: { execution_mode: 'human_or_external_installer', physical_installation_simulated: false },
      }),
    });
    return {
      success: true,
      installation: rowsCreated[0],
      message: 'Upgrade prepared. Physical installation and any firmware operation require an authorized installer and model-specific verification; CHRYSALIS does not simulate completion.',
    };
  }

  async verifyUpgrade(dto: VerifyChrysalisDto, principal: Principal) {
    if (!this.db.enabled) throw new BadRequestException('Persistent Machine Connect storage is required for verification');
    const rows = await this.db.request<any[]>(`machine_connect_installed_upgrades?id=eq.${encodeURIComponent(dto.installationId)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Installation record not found');
    const installation = rows[0];
    const observed = this.normalizeCapabilities(dto.observedCapabilities ?? installation.resulting_capabilities ?? []);

    if (!dto.passed) {
      const failed = await this.db.request<any[]>(`machine_connect_installed_upgrades?id=eq.${encodeURIComponent(dto.installationId)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'failed', verification_status: 'failed', notes: dto.notes ?? null }),
      });
      return { success: false, installation: failed[0] };
    }

    const machine = await this.machines.get(principal.tenantId, installation.machine_id);
    const merged = [...new Set([...machine.capabilities, ...observed])];
    const now = new Date().toISOString();
    const machineRows = await this.db.request<any[]>(`machine_connect_machines?id=eq.${encodeURIComponent(machine.id)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}`, {
      method: 'PATCH', body: JSON.stringify({ capabilities: merged, updated_at: now }),
    });
    if (!machineRows.length) throw new NotFoundException('Machine not found during verification');

    const updated = await this.db.request<any[]>(`machine_connect_installed_upgrades?id=eq.${encodeURIComponent(dto.installationId)}&organization_id=eq.${encodeURIComponent(principal.tenantId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'installed', verification_status: 'passed', installed_at: now, installed_by: principal.actorId, verified_at: now, verified_by: principal.actorId, resulting_capabilities: merged, notes: dto.notes ?? null }),
    });
    return { success: true, installation: updated[0], machine: machineRows[0] };
  }

  private buildRecommendations(matrix: CompatibilityRow[], missing: string[], manufacturer?: string, model?: string) {
    const result: any[] = [];
    for (const capability of missing) {
      const exact = matrix.filter((row) => row.capability_needed === capability && this.patternMatches(row.manufacturer_pattern, manufacturer) && this.patternMatches(row.model_pattern, model));
      const verified = exact.filter((row) => row.verified);
      const candidates = verified.length ? verified : exact;
      for (const row of candidates.slice(0, 3)) result.push(this.recommendationFromMatrix(row, manufacturer, model));
      if (!candidates.length) result.push(...this.buildFallbackRecommendations([capability]));
    }
    return result;
  }

  private recommendationFromMatrix(row: CompatibilityRow, manufacturer?: string, model?: string) {
    const confidence = row.verified ? 0.9 : 0.55;
    return {
      id: randomUUID(), strategy: row.strategy, title: `Modernize ${row.capability_needed}`,
      description: `${row.recommended_upgrade} is a candidate for ${manufacturer ?? 'this'} ${model ?? 'machine'}. Compatibility must be verified before installation.`,
      requiredParts: [row.recommended_upgrade], complexity: row.strategy === 'firmware_flash' ? 'high' : 'medium',
      estimatedCost: null, estimatedTime: null,
      instructions: this.generateInstructions(row.recommended_upgrade, row.strategy),
      constraints: row.constraints ?? {}, safetyClass: row.strategy === 'firmware_flash' ? 'critical' : 'control', confidence,
    };
  }

  private buildFallbackRecommendations(missing: string[]) {
    return missing.map((capability) => {
      const strategy: ChrysalisStrategy = ['wifi','bluetooth','voice_control','smart_tv'].includes(capability) ? 'hardware_addon' : ['mqtt','http','protocol_bridge'].includes(capability) ? 'software_emulation' : capability === 'firmware_update' ? 'firmware_flash' : 'hybrid';
      return {
        id: randomUUID(), strategy, title: `Candidate path for ${capability}`,
        description: `Assess a compatible ${strategy.replace('_', ' ')} path to add ${capability}. No vendor or compatibility claim is made until the exact model and interface are verified.`,
        requiredParts: [], complexity: 'unknown', estimatedCost: null, estimatedTime: null,
        instructions: this.generateInstructions('the verified upgrade component', strategy),
        constraints: { requires_model_verification: true, requires_interface_check: true },
        safetyClass: strategy === 'firmware_flash' ? 'critical' : 'control', confidence: 0.35,
      };
    });
  }

  private generateInstructions(part: string, strategy: ChrysalisStrategy) {
    return [
      { step: 1, action: 'Verify exact model, revision, interfaces, power requirements and service documentation.', required: true },
      { step: 2, action: `Prepare ${part} only after compatibility is confirmed.`, required: true },
      { step: 3, action: strategy === 'firmware_flash' ? 'Back up supported firmware/configuration and verify signed/vendor-approved image.' : 'Install or connect the approved upgrade without bypassing safety or security controls.', required: true },
      { step: 4, action: 'Run electrical, interface and functional checks before enabling new capabilities.', required: true },
      { step: 5, action: 'Register the upgrade in Machine Connect and perform a post-upgrade verification.', required: true },
    ];
  }

  private adapterRecommendations(path: any) {
    if (path.strategy === 'software_emulation' || path.strategy === 'hybrid') return [{ type: 'protocol_bridge', status: 'recommended', note: 'Create or bind an existing adapter only after interface/protocol verification.' }];
    return [];
  }

  private patternMatches(pattern?: string | null, value?: string) {
    if (!pattern || pattern === '%') return true;
    if (!value) return false;
    const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i');
    return regex.test(value);
  }

  private normalizeCapabilities(values: unknown): string[] {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }

  private localAssessment(principal: Principal, machine: any, current: string[], desired: string[], missing: string[], manufacturer?: string, model?: string, year?: number, evidence?: Record<string, unknown>) {
    return { id: randomUUID(), organization_id: principal.tenantId, machine_id: machine.id, manufacturer, model, year_manufactured: year, current_capabilities: current, desired_capabilities: desired, missing_capabilities: missing, assessment_status: 'completed', assessed_by: principal.actorId, evidence: evidence ?? {} };
  }
}
