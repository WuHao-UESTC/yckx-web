import type { HomeCategory } from "./home.types";

type RadarCategory = Pick<HomeCategory, "id">;

export type RadarTargetLayout = {
  id: string;
  x: number;
  y: number;
  angle: number;
  scanDelay: number;
};

const RADAR_SLOTS = [
  { x: 35, y: 52 },
  { x: 77, y: 30 },
  { x: 24, y: 73 },
  { x: 50, y: 16 },
  { x: 58, y: 80 },
  { x: 22, y: 33 },
  { x: 67, y: 54 },
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
      return {
        id: category.id,
        x: slot.x,
        y: slot.y,
        angle: normalizedAngle,
        scanDelay: (normalizedAngle / 360) * 10,
      };
    });
}
