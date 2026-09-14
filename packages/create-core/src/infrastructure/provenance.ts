/** Durable provenance for every generated artifact. */
export type ProvenanceNode = {
  assetId: string;
  projectId: string;
  version: number;
  parentAssetIds: string[];
  sourceJobId?: string;
  providerId?: string;
  modelId?: string;
  promptHash?: string;
  inputHash?: string;
  createdAt: string;
  derivedFrom?: string;
};

export type LineageGraph = {
  rootProjectId: string;
  nodes: ProvenanceNode[];
};

export function lineageForAsset(graph: LineageGraph, assetId: string): ProvenanceNode[] {
  const byId = new Map(graph.nodes.map(n => [n.assetId, n]));
  const out: ProvenanceNode[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    seen.add(id);
    out.push(node);
    for (const parent of node.parentAssetIds) visit(parent);
  };
  visit(assetId);
  return out;
}
