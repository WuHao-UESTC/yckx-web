export const ACTIVITY_CHART = {
  width: 720,
  height: 250,
  left: 48,
  right: 18,
  top: 18,
  bottom: 34,
} as const;

type PointerBounds = {
  height: number;
  left: number;
  width: number;
};

/** 将屏幕指针位置映射到 SVG 绘图区中的最近数据点。 */
export function activityChartIndexFromClientX(
  clientX: number,
  bounds: PointerBounds,
  pointCount: number
): number {
  if (pointCount <= 1) return 0;

  const scale = Math.min(
    bounds.width / ACTIVITY_CHART.width,
    bounds.height / ACTIVITY_CHART.height
  );
  if (!Number.isFinite(scale) || scale <= 0) return 0;

  const renderedWidth = ACTIVITY_CHART.width * scale;
  const renderedLeft = bounds.left + (bounds.width - renderedWidth) / 2;
  const viewBoxX = (clientX - renderedLeft) / scale;
  const plotWidth = ACTIVITY_CHART.width - ACTIVITY_CHART.left - ACTIVITY_CHART.right;
  const ratio = Math.min(1, Math.max(0, (viewBoxX - ACTIVITY_CHART.left) / plotWidth));

  return Math.round(ratio * (pointCount - 1));
}
