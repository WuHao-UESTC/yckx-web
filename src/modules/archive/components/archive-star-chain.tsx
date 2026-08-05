import { Star } from "lucide-react";
import type { MilestoneRecord } from "@/modules/milestones/server/milestone-service";

const MAP_HEIGHT = 410;
const CARD_TOP = 16;
const CARD_BOTTOM = 258;
const CARD_HEIGHT = 128;

function starY(index: number) {
  return [190, 166, 202, 176][index % 4];
}

export function ArchiveStarChain({ milestones }: { milestones: MilestoneRecord[] }) {
  if (milestones.length === 0) {
    return (
      <section
        className="archive-star-chain archive-star-chain--empty"
        aria-labelledby="star-chain-title"
      >
        <header className="archive-star-chain__heading">
          <div>
            <h2 id="star-chain-title">大事记星链</h2>
            <p>0 个时间坐标</p>
          </div>
        </header>
        <p>暂无大事记坐标。</p>
      </section>
    );
  }

  const canvasWidth = Math.max(1280, milestones.length * 270 + 280);
  const nodes = milestones.map((milestone, index) => {
    const x = (canvasWidth * (index + 1)) / (milestones.length + 1);
    return {
      milestone,
      x,
      xPercent: (x / canvasWidth) * 100,
      y: starY(index),
      position: index % 2 === 0 ? ("above" as const) : ("below" as const),
    };
  });
  const chainPoints = [
    `0,${MAP_HEIGHT / 2}`,
    ...nodes.map((node) => `${node.x},${node.y}`),
    `${canvasWidth},${MAP_HEIGHT / 2 - 12}`,
  ].join(" ");
  const firstYear = milestones[0].occurredAt.getFullYear();
  const lastYear = milestones[milestones.length - 1].occurredAt.getFullYear();
  const yearRange = firstYear === lastYear ? String(firstYear) : `${firstYear}—${lastYear}`;

  return (
    <section className="archive-star-chain" aria-labelledby="star-chain-title">
      <header className="archive-star-chain__heading">
        <div>
          <h2 id="star-chain-title">大事记星链</h2>
          <p>
            {milestones.length} 个时间坐标 · {yearRange}
          </p>
        </div>
        <span>STAR CHAIN / MILESTONES</span>
      </header>

      <div className="archive-star-chain__viewport" tabIndex={0} aria-label="横向浏览大事记星链">
        <div className="archive-star-chain__map" style={{ width: `max(100vw, ${canvasWidth}px)` }}>
          <svg
            viewBox={`0 0 ${canvasWidth} ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline className="archive-star-chain__route" points={chainPoints} />
            {nodes.map((node) => {
              const cardEdge = node.position === "above" ? CARD_TOP + CARD_HEIGHT : CARD_BOTTOM;
              const elbowY = node.position === "above" ? node.y - 24 : node.y + 28;
              const elbowX = node.x + (node.position === "above" ? -26 : 26);
              return (
                <polyline
                  key={node.milestone.id}
                  className="archive-star-chain__connector"
                  points={`${node.x},${node.y} ${elbowX},${elbowY} ${elbowX},${cardEdge} ${node.x},${cardEdge}`}
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <article
              key={node.milestone.id}
              className={`archive-star-chain__node is-${node.position}`}
              style={{ left: `${node.xPercent}%` }}
            >
              <span className="archive-star-chain__star" style={{ top: `${node.y}px` }}>
                <Star size={25} strokeWidth={1.4} aria-hidden="true" />
              </span>
              <div
                className="archive-star-chain__card"
                style={{ top: `${node.position === "above" ? CARD_TOP : CARD_BOTTOM}px` }}
              >
                <time dateTime={node.milestone.occurredAt.toISOString()}>
                  {node.milestone.occurredAt.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </time>
                <h3>{node.milestone.title}</h3>
                <p>{node.milestone.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="archive-star-chain__mobile">
        {milestones.map((milestone) => (
          <article key={milestone.id}>
            <span className="archive-star-chain__mobile-star">
              <Star size={21} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <div className="archive-star-chain__mobile-card">
              <time dateTime={milestone.occurredAt.toISOString()}>
                {milestone.occurredAt.toLocaleDateString("zh-CN")}
              </time>
              <h3>{milestone.title}</h3>
              <p>{milestone.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
