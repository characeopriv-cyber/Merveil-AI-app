export type ChrysalisStrategy = 'hardware_addon' | 'firmware_flash' | 'software_emulation' | 'hybrid' | 'replacement';

export interface AssessChrysalisDto {
  machineId: string;
  currentCapabilities?: string[];
  desiredCapabilities: string[];
  manufacturer?: string;
  model?: string;
  yearManufactured?: number;
  evidence?: Record<string, unknown>;
}

export interface ExecuteChrysalisDto {
  upgradePathId: string;
  notes?: string;
}

export interface VerifyChrysalisDto {
  installationId: string;
  passed: boolean;
  observedCapabilities?: string[];
  notes?: string;
}
