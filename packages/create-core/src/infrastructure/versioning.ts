/**
 * Versioning model for remix/edit/fork without destroying previous work.
 */
export type ProjectVersion = {
  projectId: string;
  version: number;
  parentVersion?: number;
  label?: string;
  intent?: string;
  assetIds: string[];
  createdAt: string;
};

export function nextVersion(current: ProjectVersion | undefined, assetIds: string[], intent?: string): ProjectVersion {
  return {
    projectId: current?.projectId ?? '',
    version: (current?.version ?? 0) + 1,
    parentVersion: current?.version,
    intent,
    assetIds,
    createdAt: new Date().toISOString(),
  };
}
