export type ConstellationLabelPlacement =
  "above" | "above-start" | "above-end" | "below" | "below-start" | "below-end";

export type ConstellationStar = {
  x: number;
  y: number;
};

export type ConstellationAnchor = {
  starIndex: number;
  label: ConstellationLabelPlacement;
};

export type ConstellationTemplate = {
  id: string;
  name: string;
  stars: readonly ConstellationStar[];
  edges: ReadonlyArray<readonly [number, number]>;
  articleAnchors: readonly ConstellationAnchor[];
};

function createAnchors(
  stars: readonly ConstellationStar[],
  starIndices: readonly number[]
): ConstellationAnchor[] {
  return starIndices.map((starIndex, anchorIndex) => {
    const star = stars[starIndex];
    const vertical = star.y < 46 ? "below" : "above";
    if (star.x < 18) return { starIndex, label: `${vertical}-start` } as ConstellationAnchor;
    if (star.x > 82) return { starIndex, label: `${vertical}-end` } as ConstellationAnchor;
    if (anchorIndex % 2 === 1) {
      return { starIndex, label: vertical === "above" ? "below" : "above" };
    }
    return { starIndex, label: vertical };
  });
}

function template(
  id: string,
  name: string,
  stars: readonly ConstellationStar[],
  edges: ReadonlyArray<readonly [number, number]>,
  articleStarIndices: readonly number[]
): ConstellationTemplate {
  return { id, name, stars, edges, articleAnchors: createAnchors(stars, articleStarIndices) };
}

export const COMPETITION_CONSTELLATIONS: readonly ConstellationTemplate[] = [
  template(
    "aries",
    "白羊座",
    [
      { x: 9, y: 62 },
      { x: 21, y: 50 },
      { x: 35, y: 43 },
      { x: 49, y: 47 },
      { x: 61, y: 58 },
      { x: 70, y: 45 },
      { x: 82, y: 35 },
      { x: 92, y: 40 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
    [0, 1, 2, 4, 5, 6, 7]
  ),
  template(
    "taurus",
    "金牛座",
    [
      { x: 8, y: 24 },
      { x: 25, y: 35 },
      { x: 42, y: 51 },
      { x: 56, y: 52 },
      { x: 74, y: 35 },
      { x: 92, y: 23 },
      { x: 41, y: 68 },
      { x: 58, y: 68 },
      { x: 50, y: 83 },
    ],
    [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [2, 6],
      [3, 7],
      [6, 8],
      [7, 8],
    ],
    [0, 1, 2, 3, 4, 5, 8]
  ),
  template(
    "gemini",
    "双子座",
    [
      { x: 22, y: 18 },
      { x: 38, y: 23 },
      { x: 25, y: 42 },
      { x: 39, y: 48 },
      { x: 20, y: 72 },
      { x: 37, y: 78 },
      { x: 63, y: 22 },
      { x: 79, y: 17 },
      { x: 62, y: 49 },
      { x: 78, y: 43 },
      { x: 64, y: 78 },
      { x: 81, y: 72 },
    ],
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [2, 4],
      [3, 5],
      [6, 7],
      [6, 8],
      [7, 9],
      [8, 9],
      [8, 10],
      [9, 11],
      [3, 8],
    ],
    [0, 2, 4, 7, 9, 11, 8]
  ),
  template(
    "cancer",
    "巨蟹座",
    [
      { x: 12, y: 56 },
      { x: 26, y: 48 },
      { x: 41, y: 57 },
      { x: 52, y: 43 },
      { x: 64, y: 55 },
      { x: 79, y: 47 },
      { x: 90, y: 58 },
      { x: 52, y: 73 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [3, 7],
    ],
    [0, 1, 2, 3, 5, 6, 7]
  ),
  template(
    "leo",
    "狮子座",
    [
      { x: 12, y: 67 },
      { x: 20, y: 48 },
      { x: 29, y: 31 },
      { x: 42, y: 24 },
      { x: 48, y: 43 },
      { x: 61, y: 57 },
      { x: 76, y: 43 },
      { x: 91, y: 58 },
      { x: 76, y: 75 },
      { x: 58, y: 73 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 5],
    ],
    [0, 2, 3, 4, 6, 7, 8]
  ),
  template(
    "virgo",
    "处女座",
    [
      { x: 9, y: 38 },
      { x: 22, y: 47 },
      { x: 37, y: 40 },
      { x: 51, y: 51 },
      { x: 66, y: 43 },
      { x: 82, y: 50 },
      { x: 93, y: 38 },
      { x: 34, y: 66 },
      { x: 50, y: 78 },
      { x: 67, y: 69 },
      { x: 53, y: 24 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [2, 7],
      [7, 8],
      [8, 9],
      [3, 10],
    ],
    [0, 2, 3, 5, 6, 8, 10]
  ),
  template(
    "libra",
    "天秤座",
    [
      { x: 12, y: 62 },
      { x: 28, y: 43 },
      { x: 45, y: 33 },
      { x: 62, y: 43 },
      { x: 88, y: 61 },
      { x: 45, y: 63 },
      { x: 62, y: 72 },
      { x: 30, y: 77 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [5, 6],
      [6, 3],
      [5, 7],
    ],
    [0, 1, 2, 3, 4, 6, 7]
  ),
  template(
    "scorpio",
    "天蝎座",
    [
      { x: 8, y: 26 },
      { x: 20, y: 35 },
      { x: 32, y: 30 },
      { x: 42, y: 42 },
      { x: 51, y: 55 },
      { x: 60, y: 67 },
      { x: 72, y: 75 },
      { x: 84, y: 69 },
      { x: 92, y: 57 },
      { x: 84, y: 48 },
      { x: 75, y: 54 },
      { x: 66, y: 47 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
    ],
    [0, 2, 3, 5, 6, 8, 10]
  ),
  template(
    "sagittarius",
    "射手座",
    [
      { x: 11, y: 70 },
      { x: 27, y: 58 },
      { x: 43, y: 48 },
      { x: 59, y: 37 },
      { x: 78, y: 24 },
      { x: 91, y: 18 },
      { x: 70, y: 18 },
      { x: 78, y: 39 },
      { x: 48, y: 68 },
      { x: 62, y: 78 },
      { x: 31, y: 77 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [4, 6],
      [4, 7],
      [2, 8],
      [8, 9],
      [8, 10],
    ],
    [0, 1, 2, 4, 5, 8, 9]
  ),
  template(
    "capricorn",
    "摩羯座",
    [
      { x: 9, y: 39 },
      { x: 24, y: 28 },
      { x: 43, y: 34 },
      { x: 59, y: 49 },
      { x: 78, y: 43 },
      { x: 92, y: 57 },
      { x: 72, y: 73 },
      { x: 50, y: 78 },
      { x: 30, y: 66 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 0],
      [3, 7],
    ],
    [0, 1, 2, 4, 5, 6, 8]
  ),
  template(
    "aquarius",
    "水瓶座",
    [
      { x: 7, y: 35 },
      { x: 20, y: 27 },
      { x: 33, y: 38 },
      { x: 47, y: 28 },
      { x: 61, y: 39 },
      { x: 75, y: 29 },
      { x: 92, y: 37 },
      { x: 16, y: 65 },
      { x: 31, y: 56 },
      { x: 47, y: 68 },
      { x: 64, y: 57 },
      { x: 82, y: 67 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [2, 8],
      [4, 10],
    ],
    [0, 2, 3, 5, 6, 8, 10]
  ),
  template(
    "pisces",
    "双鱼座",
    [
      { x: 9, y: 35 },
      { x: 18, y: 24 },
      { x: 30, y: 30 },
      { x: 28, y: 45 },
      { x: 15, y: 49 },
      { x: 43, y: 50 },
      { x: 56, y: 54 },
      { x: 70, y: 48 },
      { x: 82, y: 57 },
      { x: 92, y: 48 },
      { x: 88, y: 33 },
      { x: 75, y: 32 },
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [3, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 7],
    ],
    [0, 2, 4, 5, 7, 9, 11]
  ),
] as const;

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectCompetitionConstellation(key: string): ConstellationTemplate {
  return COMPETITION_CONSTELLATIONS[stableHash(key) % COMPETITION_CONSTELLATIONS.length];
}
