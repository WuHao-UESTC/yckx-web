import type { ConstellationStar, ConstellationTemplate } from "./competition-constellations";

export type ConstellationLabelSide = "left" | "right";

export type CompetitionConstellationLabelLayout = {
  articleIndex: number;
  starIndex: number;
  side: ConstellationLabelSide;
  starX: number;
  starY: number;
  labelY: number;
  elbowX: number;
  railX: number;
};

const PLOT_LEFT = 29;
const PLOT_TOP = 6;
const PLOT_WIDTH = 42;
const PLOT_HEIGHT = 88;
const LABEL_MIN_Y = 11;
const LABEL_MAX_Y = 89;
const LABEL_GAP = 23;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function projectCompetitionConstellationStar(star: ConstellationStar): ConstellationStar {
  return {
    x: PLOT_LEFT + (star.x / 100) * PLOT_WIDTH,
    y: PLOT_TOP + (star.y / 100) * PLOT_HEIGHT,
  };
}

function packLabelPositions(desiredPositions: readonly number[]): number[] {
  if (desiredPositions.length === 0) return [];

  const positions = desiredPositions.map((position) => clamp(position, LABEL_MIN_Y, LABEL_MAX_Y));

  for (let index = 1; index < positions.length; index += 1) {
    positions[index] = Math.max(positions[index], positions[index - 1] + LABEL_GAP);
  }

  if (positions.at(-1)! > LABEL_MAX_Y) {
    positions[positions.length - 1] = LABEL_MAX_Y;
    for (let index = positions.length - 2; index >= 0; index -= 1) {
      positions[index] = Math.min(positions[index], positions[index + 1] - LABEL_GAP);
    }
  }

  return positions.map((position) => Number(position.toFixed(4)));
}

export function createCompetitionConstellationLabelLayouts(
  constellation: ConstellationTemplate,
  articleCount: number
): CompetitionConstellationLabelLayout[] {
  const anchors = constellation.articleAnchors
    .slice(0, articleCount)
    .map((anchor, articleIndex) => ({
      articleIndex,
      starIndex: anchor.starIndex,
      star: constellation.stars[anchor.starIndex],
    }));
  const orderedByX = [...anchors].sort(
    (first, second) => first.star.x - second.star.x || first.articleIndex - second.articleIndex
  );
  const leftArticleIndices = new Set(
    orderedByX.slice(0, Math.ceil(orderedByX.length / 2)).map((item) => item.articleIndex)
  );

  const layouts: CompetitionConstellationLabelLayout[] = [];
  for (const side of ["left", "right"] as const) {
    const sideAnchors = anchors
      .filter((anchor) => leftArticleIndices.has(anchor.articleIndex) === (side === "left"))
      .map((anchor) => ({
        ...anchor,
        projectedStar: projectCompetitionConstellationStar(anchor.star),
      }))
      .sort(
        (first, second) =>
          first.projectedStar.y - second.projectedStar.y || first.articleIndex - second.articleIndex
      );
    const labelPositions = packLabelPositions(sideAnchors.map((anchor) => anchor.projectedStar.y));

    sideAnchors.forEach((anchor, index) => {
      layouts.push({
        articleIndex: anchor.articleIndex,
        starIndex: anchor.starIndex,
        side,
        starX: anchor.projectedStar.x,
        starY: anchor.projectedStar.y,
        labelY: labelPositions[index],
        elbowX: side === "left" ? 27 : 73,
        railX: side === "left" ? 25 : 75,
      });
    });
  }

  return layouts.sort((first, second) => first.articleIndex - second.articleIndex);
}
