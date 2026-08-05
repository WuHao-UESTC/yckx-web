import type { HomeCategory } from "./home.types";

type GraphCategory = Pick<HomeCategory, "id">;

export type TideLinkDefinition = {
  id: string;
  sourceId: string;
  targetId: string;
  lengthRatio: number;
};

export type TideAnchor = {
  x: number;
  y: number;
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableUnit(value: string): number {
  return stableHash(value) / 0xffffffff;
}

function pairKey(firstId: string, secondId: string): string {
  return firstId < secondId ? `${firstId}:${secondId}` : `${secondId}:${firstId}`;
}

export function createTideAnchor(id: string): TideAnchor {
  return {
    x: 0.2 + stableUnit(`${id}:anchor-x`) * 0.6,
    y: 0.18 + stableUnit(`${id}:anchor-y`) * 0.64,
  };
}

export function createTideLinks(categories: readonly GraphCategory[]): TideLinkDefinition[] {
  const orderedIds = [...new Set(categories.map((category) => category.id))].sort(
    (firstId, secondId) =>
      stableHash(firstId) - stableHash(secondId) || firstId.localeCompare(secondId)
  );
  if (orderedIds.length < 2) return [];

  const links: TideLinkDefinition[] = [];
  const linkIds = new Set<string>();
  const degrees = new Map(orderedIds.map((id) => [id, 0]));

  const addLink = (sourceId: string, targetId: string) => {
    const id = pairKey(sourceId, targetId);
    if (sourceId === targetId || linkIds.has(id)) return;
    linkIds.add(id);
    degrees.set(sourceId, (degrees.get(sourceId) ?? 0) + 1);
    degrees.set(targetId, (degrees.get(targetId) ?? 0) + 1);
    links.push({
      id,
      sourceId,
      targetId,
      lengthRatio: 0.86 + stableUnit(`${id}:length`) * 0.28,
    });
  };

  if (orderedIds.length === 2) {
    addLink(orderedIds[0], orderedIds[1]);
    return links;
  }

  for (let index = 0; index < orderedIds.length; index += 1) {
    addLink(orderedIds[index], orderedIds[(index + 1) % orderedIds.length]);
  }

  const candidates: Array<{ sourceId: string; targetId: string; score: number }> = [];
  for (let sourceIndex = 0; sourceIndex < orderedIds.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < orderedIds.length; targetIndex += 1) {
      const sourceId = orderedIds[sourceIndex];
      const targetId = orderedIds[targetIndex];
      const id = pairKey(sourceId, targetId);
      if (!linkIds.has(id)) {
        candidates.push({ sourceId, targetId, score: stableHash(`${id}:extra`) });
      }
    }
  }
  candidates.sort((first, second) => first.score - second.score);

  const extraLinkCount = Math.floor(orderedIds.length / 3);
  for (const candidate of candidates) {
    if (links.length >= orderedIds.length + extraLinkCount) break;
    if ((degrees.get(candidate.sourceId) ?? 0) >= 4) continue;
    if ((degrees.get(candidate.targetId) ?? 0) >= 4) continue;
    addLink(candidate.sourceId, candidate.targetId);
  }

  return links;
}
