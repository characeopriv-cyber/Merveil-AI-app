import networkx as nx
from typing import Any

class WorkflowGraph:
    def __init__(self, *, workflow: dict, nodes: list[dict], edges: list[dict]):
        self.workflow = workflow
        self.nodes = {n["id"]: n for n in nodes}
        self.edges = edges
        self.g = nx.DiGraph()
        for nid in self.nodes:
            self.g.add_node(nid)
        for e in edges:
            self.g.add_edge(
                e["from_node"], e["to_node"],
                port=e.get("port", "out"),
                condition=e.get("condition"),
            )
        self.entry = self._find_entry()
        self.exits = [nid for nid in self.g.nodes if self.g.out_degree(nid) == 0]

    def _find_entry(self) -> str:
        for nid, n in self.nodes.items():
            if n["kind"] == "input":
                return nid
        for nid in self.g.nodes:
            if self.g.in_degree(nid) == 0:
                return nid
        raise ValueError("no_entry_node")

    def outgoing(self, node_id: str, port: str | None = None) -> list[dict]:
        out = []
        for e in self.edges:
            if e["from_node"] != node_id:
                continue
            if port and e.get("port", "out") != port:
                continue
            out.append(e)
        return out

    def predecessors(self, node_id: str) -> list[str]:
        return list(self.g.predecessors(node_id))

    def node(self, nid: str) -> dict:
        return self.nodes[nid]

    def is_dag(self) -> bool:
        return nx.is_directed_acyclic_graph(self.g)
