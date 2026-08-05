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
 * 全宽布局：图谱 60% | 详情面板 40%
 */
export function KnowledgeGraphCanvas({ nodes, links }: Props) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div
      className="flex flex-col lg:flex-row gap-0 max-w-[1400px] mx-auto"
      style={{ minHeight: "calc(100vh - 140px)" }}
    >
      {/* 左侧：知识图谱 — 60% */}
      <div className="w-full lg:w-[60%] bg-[#fdfcf9] flex items-center justify-center border-r border-[#e8e0d5] p-4">
        <div className="w-full h-full flex items-center justify-center">
          <KnowledgeGraph
            nodes={nodes}
            links={links}
            selectedId={selectedNode?.id ?? null}
            onSelectNode={setSelectedNode}
          />
        </div>
      </div>

      {/* 右侧：详情面板 — 40% */}
      <div className="w-full lg:w-[40%] bg-white p-6 lg:p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <GraphDetailPanel selectedNode={selectedNode} />
        </div>
      </div>
    </div>
  );
}
