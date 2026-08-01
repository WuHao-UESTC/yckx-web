"use client";

import { useState } from "react";
import { KnowledgeGraph } from "./knowledge-graph";
import { GraphDetailPanel } from "./graph-detail-panel";
import type { GraphNode, GraphLink } from "./knowledge-graph";

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * 知识图谱 + 详情面板联动容器。
 * 左侧 SVG 力导向图，右侧动态文章列表。
 */
export function KnowledgeGraphCanvas({ nodes, links }: Props) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 图谱 */}
      <div className="min-h-[380px] flex items-center justify-center bg-[#fdfcf9] rounded-md border border-[#e8e0d5]">
        <KnowledgeGraph
          nodes={nodes}
          links={links}
          selectedId={selectedNode?.id ?? null}
          onSelectNode={setSelectedNode}
        />
      </div>
      {/* 详情面板 */}
      <div className="min-h-[380px] card">
        <GraphDetailPanel selectedNode={selectedNode} />
      </div>
    </div>
  );
}
