import type { HomeCategory } from "./home.types";

type RadarCategory = Pick<HomeCategory, "id">;

export type RadarTargetLayout = {
  id: string;
  x: number;
  y: number;
  angle: number;
  bearing: number;
  distance: number;
  scanDelay: number;
};

const RADAR_SLOTS = [
  { x: 34, y: 50 },
  { x: 78, y: 28 },
  { x: 23, y: 75 },
  { x: 48, y: 15 },
  { x: 60, y: 82 },
  { x: 20, y: 30 },
  { x: 72, y: 56 },
] as const;

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRadarTargetLayouts(
  categories: readonly RadarCategory[]
): RadarTargetLayout[] {
  return [...categories]
    .sort(
      (first, second) =>
        stableHash(first.id) - stableHash(second.id) || first.id.localeCompare(second.id)
    )
    .slice(0, RADAR_SLOTS.length)
    .map((category, index) => {
      const slot = RADAR_SLOTS[index];
      const angle = (Math.atan2(slot.y - 50, slot.x - 50) * 180) / Math.PI;
      const normalizedAngle = (angle + 360) % 360;
      const bearing = (normalizedAngle + 90) % 360;
      const distance = Math.hypot(slot.x - 50, slot.y - 50);
      return {
        id: category.id,
        x: slot.x,
        y: slot.y,
        angle: normalizedAngle,
        bearing,
        distance,
        scanDelay: (normalizedAngle / 360) * 10,
      };
    });
}
