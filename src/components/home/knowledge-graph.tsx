"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3Force from "d3-force";
import * as d3Selection from "d3-selection";
import * as d3Drag from "d3-drag";

export interface GraphNode {
  id: string;
  label: string;
  type: "main" | "category" | "subcategory";
  categorySlug?: string;
  radius?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  categorySlug?: string;
  radius: number;
}

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode?: (node: GraphNode) => void;
  selectedId?: string | null;
}

export function KnowledgeGraph({ nodes, links, onSelectNode, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3Force.Simulation<SimNode, d3Force.SimulationLinkDatum<SimNode>> | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const COLORS: Record<string, string> = {
    main: "#8b5e3c",
    category: "#6b8b5e",
    subcategory: "#c4a882",
  };

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 准备数据
    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      categorySlug: n.categorySlug,
      radius: n.radius ?? (n.type === "main" ? 28 : n.type === "category" ? 20 : 14),
    }));

    const simLinks = links.map((l) => ({
      source: l.source,
      target: l.target,
    }));

    // 创建力模拟
    const sim = d3Force.forceSimulation<SimNode>(simNodes)
      .force("link", d3Force.forceLink<SimNode, d3Force.SimulationLinkDatum<SimNode>>(simLinks)
        .id((d) => d.id)
        .distance(120))
      .force("charge", d3Force.forceManyBody().strength(-350))
      .force("center", d3Force.forceCenter(width / 2, height / 2))
      .force("collision", d3Force.forceCollide<SimNode>().radius((d) => d.radius + 8))
      .alphaDecay(0.02);

    simRef.current = sim;

    // SVG 设置
    const svgSel = d3Selection.select(svg);
    svgSel.selectAll("*").remove();
    svgSel.attr("viewBox", `0 0 ${width} ${height}`);

    // 定义箭头 marker（备用）
    svgSel.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#c4a882");

    // 连线
    const linkGroup = svgSel.append("g").attr("class", "links");
    const linkEls = linkGroup.selectAll<SVGLineElement, d3Force.SimulationLinkDatum<SimNode>>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "#e8e0d5")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.7);

    // 节点组
    const nodeGroup = svgSel.append("g").attr("class", "nodes");
    const nodeEls = nodeGroup.selectAll<SVGGElement, SimNode>("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3Drag.drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // 圆
    nodeEls.append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => COLORS[d.type] || "#c4a882")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    // 标签
    nodeEls.append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.radius + 14)
      .attr("font-size", "11px")
      .attr("fill", "#6b6b6b")
      .attr("font-family", "var(--font-sans), PingFang SC, Microsoft YaHei, sans-serif");

    // 点击
    nodeEls.on("click", (_event, d) => {
      onSelectNode?.({
        id: d.id,
        label: d.label,
        type: d.type as GraphNode["type"],
        categorySlug: d.categorySlug,
      });
    });

    // hover
    nodeEls.on("mouseenter", (_event, d) => setHoveredId(d.id));
    nodeEls.on("mouseleave", () => setHoveredId(null));

    // 每帧更新
    sim.on("tick", () => {
      linkEls
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeEls.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links, onSelectNode]);

  // 选中/悬浮高亮
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const highlightId = selectedId || hoveredId;
    const sel = d3Selection.select(svg);

    sel.selectAll<SVGCircleElement, SimNode>("circle")
      .attr("opacity", (d) => {
        if (!highlightId) return 0.9;
        return d.id === highlightId ? 1 : 0.35;
      })
      .attr("stroke", (d) => {
        if (!highlightId) return "#fff";
        return d.id === highlightId ? "#8b5e3c" : "#fff";
      })
      .attr("stroke-width", (d) => {
        if (!highlightId) return 2;
        return d.id === highlightId ? 3 : 1;
      });

    sel.selectAll<SVGLineElement, d3Force.SimulationLinkDatum<SimNode>>("line")
      .attr("stroke-opacity", (d) => {
        if (!highlightId) return 0.7;
        const src = (d.source as SimNode).id;
        const tgt = (d.target as SimNode).id;
        return (src === highlightId || tgt === highlightId) ? 0.9 : 0.1;
      });
  }, [selectedId, hoveredId]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
