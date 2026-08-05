import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  ChevronRight,
  Compass,
  Radio,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { HomePost, OceanHomeData } from "../home.types";
import { DepthNavigation } from "./depth-navigation";
import { KnowledgeTide } from "./knowledge-tide";
import { OceanExperience } from "./ocean-experience";

function postHref(post: HomePost): string {
  if (post.categoryType === "COMPETITION") {
    return `/competition/${post.categorySlug ?? "uncategorized"}/${post.slug}`;
  }
  if (post.categoryType === "EVENT") return `/events/${post.slug}`;
  return `/knowledge-base/${post.categorySlug ?? "uncategorized"}/${post.slug}`;
}

function ChapterLabel({ depth, children }: { depth: string; children: React.ReactNode }) {
  return (
    <div className="chapter-label">
      <span>{depth}</span>
      <i aria-hidden="true" />
      <strong>{children}</strong>
    </div>
  );
}

function EmptySignal({ children }: { children: React.ReactNode }) {
  return <p className="empty-signal">{children}</p>;
}

export function OceanHome({ data }: { data: OceanHomeData }) {
  const leadEvent = data.recentEvents[0];

  return (
    <OceanExperience>
      <DepthNavigation />

      <section
        id="surface"
        className="ocean-chapter ocean-hero is-active"
        aria-labelledby="hero-title"
      >
        <Image
          src="/images/ocean/hero-whale.webp"
          alt="星空与月光下，一只座头鲸跃出海面"
          fill
          priority
          sizes="100vw"
          className="ocean-chapter__image ocean-hero__image"
        />
        <div className="ocean-hero__veil" />
        <div className="ocean-hero__stars" aria-hidden="true" />
        <div className="surface-dive-transition" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <i />
        </div>

        <div className="ocean-hero__content">
          <p className="ocean-kicker">UESTC · HONORS COLLEGE · SCIENCE & TECHNOLOGY ASSOCIATION</p>
          <h1 id="hero-title">
            <span>电子科技大学英才实验学院</span>
            科学技术协会
          </h1>
          <p className="ocean-hero__lead">以好奇为航向，向未知更深处。</p>
          <div className="ocean-hero__actions">
            <a href="#knowledge" className="ocean-button ocean-button--light">
              <Compass size={18} aria-hidden="true" />
              开始探索
            </a>
            <Link href="/knowledge-base" className="ocean-text-link ocean-text-link--light">
              直接进入知识库
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <a href="#knowledge" className="reef-entry" aria-label="随鲸下潜至知识潮汐">
          <span>随鲸下潜</span>
          <ArrowDown size={18} aria-hidden="true" />
        </a>

        <div className="ocean-hero__stats" aria-label="站点内容概况">
          <span>
            <strong>{data.totals.posts}</strong> 篇公开文章
          </span>
          <span>
            <strong>{data.totals.categories}</strong> 个探索方向
          </span>
          <span>
            <strong>{data.totals.members}</strong> 位同行者
          </span>
        </div>
      </section>

      <section
        id="knowledge"
        className="ocean-chapter ocean-knowledge"
        aria-labelledby="knowledge-title"
      >
        <Image
          src="/images/ocean/knowledge-descent-clean.webp"
          alt="座头鲸穿过月光与海草，游向发光的知识网络"
          fill
          sizes="100vw"
          className="ocean-chapter__image"
        />
        <div className="ocean-knowledge__veil" />
        <div className="ocean-section-layout">
          <div className="ocean-section-copy">
            <ChapterLabel depth="80m">知识潮汐</ChapterLabel>
            <h2 id="knowledge-title">知识不是孤岛，它在分享中形成洋流。</h2>
            <p>
              从嵌入式系统到信号处理，从基础工具到项目复盘，每一篇记录都成为后来者可以辨认的光点。
            </p>
            <Link href="/knowledge-base" className="ocean-button ocean-button--gold">
              进入知识库
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <KnowledgeTide categories={data.knowledgeCategories} />
        </div>

        {data.featuredPosts.length > 0 && (
          <div className="ocean-story-strip">
            <p>本期精选</p>
            {data.featuredPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href={postHref(post)}>
                <span>{post.categoryName ?? "知识记录"}</span>
                <strong>{post.title}</strong>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        id="competition"
        className="ocean-chapter ocean-competition"
        aria-labelledby="competition-title"
      >
        <div className="sonar-field" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
        </div>
        <div className="ocean-section-layout ocean-section-layout--reverse">
          <div className="competition-routes" aria-label="竞赛分类">
            <div className="competition-routes__axis" aria-hidden="true" />
            {data.competitionCategories.length === 0 ? (
              <EmptySignal>新的竞赛航线即将出现。</EmptySignal>
            ) : (
              data.competitionCategories.slice(0, 7).map((category, index) => (
                <Link
                  key={category.id}
                  href={`/competition/${category.slug}`}
                  className="competition-route"
                  style={{ "--route-index": index } as React.CSSProperties}
                >
                  <span className="competition-route__signal" aria-hidden="true" />
                  <span>
                    <small>ROUTE {String(index + 1).padStart(2, "0")}</small>
                    <strong>{category.name}</strong>
                  </span>
                  <b>{category.count}</b>
                </Link>
              ))
            )}
          </div>

          <div className="ocean-section-copy ocean-section-copy--right">
            <ChapterLabel depth="300m">竞赛航线</ChapterLabel>
            <Trophy
              className="chapter-icon chapter-icon--gold"
              size={34}
              strokeWidth={1.4}
              aria-hidden="true"
            />
            <h2 id="competition-title">把未知拆成问题，把问题变成可以抵达的坐标。</h2>
            <p>经验、资料、队伍与成果沿着同一条航线沉淀。这里不仅记录奖项，也记录每一次试错。</p>
            <Link href="/competition" className="ocean-button ocean-button--gold">
              查看全部航线
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="events" className="ocean-chapter ocean-events" aria-labelledby="events-title">
        <div className="ocean-events__glow" aria-hidden="true" />
        <div className="ocean-section-layout">
          <div className="ocean-section-copy">
            <ChapterLabel depth="900m">时间回声</ChapterLabel>
            <Radio className="chapter-icon" size={34} strokeWidth={1.4} aria-hidden="true" />
            <h2 id="events-title">每一次发生，都在深处留下回声。</h2>
            <p>最新消息是一束正在抵达的信号，历年的活动和选择则沉淀为科协共同的时间地层。</p>
            <Link href="/events" className="ocean-button ocean-button--light">
              打开完整日志
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="event-transmissions">
            {leadEvent ? (
              <Link
                href={postHref(leadEvent)}
                className="event-transmission event-transmission--lead"
              >
                <span>最新信号</span>
                <time>
                  {leadEvent.publishedAt
                    ? new Date(leadEvent.publishedAt).toLocaleDateString("zh-CN")
                    : "最近"}
                </time>
                <h3>{leadEvent.title}</h3>
                {leadEvent.excerpt && <p>{leadEvent.excerpt}</p>}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <EmptySignal>暂未接收到新的活动信号。</EmptySignal>
            )}

            <div className="event-transmission__timeline">
              {data.recentEvents.slice(1, 5).map((event) => (
                <Link key={event.id} href={postHref(event)}>
                  <i aria-hidden="true" />
                  <time>
                    {event.publishedAt
                      ? new Date(event.publishedAt).toLocaleDateString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "--"}
                  </time>
                  <strong>{event.title}</strong>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="routine" className="ocean-chapter ocean-routine" aria-labelledby="routine-title">
        <div className="station-light station-light--one" aria-hidden="true" />
        <div className="station-light station-light--two" aria-hidden="true" />
        <div className="routine-heading">
          <ChapterLabel depth="1800m">同行灯火</ChapterLabel>
          <Camera className="chapter-icon" size={34} strokeWidth={1.4} aria-hidden="true" />
          <h2 id="routine-title">越向深处，同行的灯光越显得珍贵。</h2>
          <p>实验室里的夜晚、比赛途中的照片、随手留下的一句话，组成技术之外真实的科协。</p>
        </div>

        <div className="routine-station">
          <div className="routine-photos">
            {data.photos.length === 0 ? (
              <div className="routine-photo routine-photo--empty">
                <Camera size={28} aria-hidden="true" />
                <span>等待下一次记录</span>
              </div>
            ) : (
              data.photos.slice(0, 5).map((photo, index) => (
                <figure key={photo.id} className={`routine-photo routine-photo--${index + 1}`}>
                  {/* 用户上传路径可能来自 NAS，保持原始图片标签兼容现有配置。 */}
                  <img src={photo.imagePath} alt={photo.caption ?? "科协日常照片"} loading="lazy" />
                  {photo.caption && <figcaption>{photo.caption}</figcaption>}
                </figure>
              ))
            )}
          </div>

          <div className="routine-console">
            <div className="routine-console__section">
              <div className="routine-console__title">
                <Users size={17} aria-hidden="true" />
                <span>同行者</span>
                <Link href="/friends">全部成员</Link>
              </div>
              <div className="routine-members">
                {data.members.slice(0, 4).map((member) => (
                  <Link key={member.id} href={`/friends/${member.username}`}>
                    <span>{member.name.charAt(0)}</span>
                    <strong>{member.name}</strong>
                    <small>{member.title}</small>
                  </Link>
                ))}
              </div>
            </div>

            <div className="routine-console__section">
              <div className="routine-console__title">
                <Radio size={17} aria-hidden="true" />
                <span>舱内留言</span>
                <Link href="/routine">进入日常</Link>
              </div>
              <div className="routine-notes">
                {data.notes.length === 0 ? (
                  <EmptySignal>第一条留言仍在等待。</EmptySignal>
                ) : (
                  data.notes.slice(0, 3).map((note) => (
                    <blockquote key={note.id}>
                      <p>{note.content}</p>
                      <cite>{note.authorName}</cite>
                    </blockquote>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="honors" className="ocean-chapter ocean-honors" aria-labelledby="honors-title">
        <Image
          src="/images/ocean/honors-abyss.webp"
          alt="深海中的座头鲸用鲸歌点亮金色星图"
          fill
          sizes="100vw"
          className="ocean-chapter__image"
        />
        <div className="ocean-honors__veil" />
        <div className="honors-layout">
          <div className="ocean-section-copy">
            <ChapterLabel depth="4000m">海底星图</ChapterLabel>
            <Sparkles
              className="chapter-icon chapter-icon--gold"
              size={34}
              strokeWidth={1.4}
              aria-hidden="true"
            />
            <h2 id="honors-title">星光沉入海底，成为我们共同抵达过的坐标。</h2>
            <p>让知识被分享，让热爱被看见，让每一次实践都成为抵达未知的航线。</p>
          </div>

          <div className="honor-constellation">
            {[
              ["求真", "从问题出发，以证据抵达答案"],
              ["协作", "让不同方向的光汇成一条航线"],
              ["创造", "把想象变成能够运行的作品"],
              ["传承", "把走过的弯路留给后来者作地图"],
            ].map(([title, description], index) => (
              <article key={title} className={`honor-star honor-star--${index + 1}`}>
                <span aria-hidden="true" />
                <small>STAR {String(index + 1).padStart(2, "0")}</small>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="honor-wall">
          <div>
            <Trophy size={22} aria-hidden="true" />
            <span>荣誉记录</span>
          </div>
          <p>全国大学生电子设计竞赛 · 集成电路创新创业大赛 · 物联网设计竞赛 · 更多航线持续点亮</p>
          <Link href="/competition">
            查看竞赛成果
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </OceanExperience>
  );
}
