"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEPTHS = ["surface", "knowledge", "competition", "events", "routine", "honors"] as const;

interface Particle {
  x: number;
  y: number;
  radius: number;
  drift: number;
  speed: number;
  phase: number;
  opacity: number;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 0.7 + Math.random() * 2.1,
    drift: (Math.random() - 0.5) * 0.00012,
    speed: 0.000025 + Math.random() * 0.00008,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.2 + Math.random() * 0.65,
  }));
}

type ParticleColor = readonly [number, number, number];

function particleColor(depth: number, particleIndex: number): ParticleColor {
  if (depth === 0) {
    return particleIndex % 5 === 0 ? [242, 198, 109] : [224, 246, 252];
  }
  if (depth === 1) return particleIndex % 7 === 0 ? [143, 232, 210] : [166, 232, 245];
  if (depth === 2) return particleIndex % 4 === 0 ? [104, 207, 178] : [128, 216, 231];
  if (depth === 3) return [163, 218, 230];
  if (depth === 4) return particleIndex % 6 === 0 ? [242, 198, 109] : [127, 195, 210];
  return particleIndex % 3 === 0 ? [242, 198, 109] : [204, 234, 241];
}

function interpolatedParticleColor(depthPosition: number, particleIndex: number): string {
  const currentDepth = Math.floor(depthPosition);
  const nextDepth = Math.min(currentDepth + 1, DEPTHS.length - 1);
  const progress = depthPosition - currentDepth;
  const from = particleColor(currentDepth, particleIndex);
  const to = particleColor(nextDepth, particleIndex);

  return from
    .map((channel, index) => Math.round(channel + (to[index] - channel) * progress))
    .join(", ");
}

function drawJellyfish(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  phase: number
) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = `rgba(142, 224, 222, ${opacity})`;
  context.fillStyle = `rgba(115, 208, 211, ${opacity * 0.13})`;
  context.lineWidth = 0.8;
  context.beginPath();
  context.arc(0, 0, size, Math.PI, Math.PI * 2);
  context.quadraticCurveTo(size * 0.6, size * 0.42, 0, size * 0.55);
  context.quadraticCurveTo(-size * 0.6, size * 0.42, -size, 0);
  context.fill();
  context.stroke();

  for (let strand = -1; strand <= 1; strand += 1) {
    context.beginPath();
    context.moveTo(strand * size * 0.42, size * 0.48);
    context.bezierCurveTo(
      strand * size * 0.65 + Math.sin(phase) * 3,
      size * 1.1,
      strand * size * 0.15 - Math.sin(phase) * 4,
      size * 1.35,
      strand * size * 0.45,
      size * 1.8
    );
    context.stroke();
  }
  context.restore();
}

function BioluminescentField({ depthPositionRef }: { depthPositionRef: { current: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let lastTime = performance.now();
    let pageVisible = document.visibilityState === "visible";

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = createParticles(width < 700 ? 28 : 66);
    };

    const draw = (time: number) => {
      const elapsed = Math.min(time - lastTime, 40);
      lastTime = time;
      context.clearRect(0, 0, width, height);

      const depthPosition = depthPositionRef.current;
      const currentDepth = Math.floor(depthPosition);
      const nextDepth = Math.min(currentDepth + 1, DEPTHS.length - 1);
      const depthProgress = depthPosition - currentDepth;
      const densities = [0.62, 1, 0.76, 0.76, 0.52, 0.52];
      const density =
        densities[currentDepth] + (densities[nextDepth] - densities[currentDepth]) * depthProgress;
      const visibleCount = Math.floor(particles.length * density);

      particles.slice(0, visibleCount).forEach((particle, index) => {
        if (!reducedMotion.matches) {
          particle.y -= particle.speed * elapsed * (0.35 + Math.min(depthPosition, 1) * 0.65);
          particle.x +=
            particle.drift * elapsed + Math.sin(time * 0.00035 + particle.phase) * 0.00003;
          if (particle.y < -0.05) particle.y = 1.05;
          if (particle.x < -0.05) particle.x = 1.05;
          if (particle.x > 1.05) particle.x = -0.05;
        }

        const pulse = 0.55 + Math.sin(time * 0.0012 + particle.phase) * 0.3;
        const opacity = particle.opacity * pulse;
        const x = particle.x * width;
        const y = particle.y * height;
        const color = interpolatedParticleColor(depthPosition, index);

        if (
          depthPosition >= 1.5 &&
          depthPosition <= 3.5 &&
          width >= 700 &&
          index > 0 &&
          index % 22 === 0
        ) {
          drawJellyfish(
            context,
            x,
            y,
            10 + particle.radius * 3.5,
            opacity * 0.42,
            time * 0.001 + particle.phase
          );
          return;
        }

        context.beginPath();
        context.fillStyle = `rgba(${color}, ${opacity})`;
        context.shadowColor = `rgba(${color}, ${opacity})`;
        context.shadowBlur = 7 + particle.radius * 3;
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;

        if (depthPosition > 0.35 && index % 9 === 0) {
          context.beginPath();
          context.strokeStyle = `rgba(${color}, ${opacity * 0.42})`;
          context.lineWidth = 0.6;
          context.arc(x, y, particle.radius * 3.8, 0, Math.PI * 2);
          context.stroke();
        }
      });

      if (pageVisible && !reducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibility = () => {
      pageVisible = document.visibilityState === "visible";
      if (pageVisible && !reducedMotion.matches) {
        lastTime = performance.now();
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleMotionPreference = () => {
      window.cancelAnimationFrame(animationFrame);
      draw(performance.now());
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [depthPositionRef]);

  return <canvas ref={canvasRef} className="bioluminescent-field" aria-hidden="true" />;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

interface ChapterPosition {
  index: number;
  progress: number;
}

function getChapterSections(): HTMLElement[] {
  return DEPTHS.map((depth) => document.getElementById(depth)).filter(
    (section): section is HTMLElement => Boolean(section)
  );
}

function captureChapterPosition(sections = getChapterSections()): ChapterPosition {
  const scrollPosition = window.scrollY;
  let index = 0;

  sections.forEach((section, sectionIndex) => {
    if (section.offsetTop <= scrollPosition + 2) index = sectionIndex;
  });

  const currentTop = sections[index]?.offsetTop ?? 0;
  const nextTop = sections[index + 1]?.offsetTop ?? currentTop + window.innerHeight;

  return {
    index,
    progress: clamp((scrollPosition - currentTop) / Math.max(nextTop - currentTop, 1), 0, 1),
  };
}

function restoreChapterPosition(position: ChapterPosition) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const sections = getChapterSections();
      const currentTop = sections[position.index]?.offsetTop ?? 0;
      const nextTop = sections[position.index + 1]?.offsetTop ?? currentTop + window.innerHeight;

      window.scrollTo({
        top: currentTop + (nextTop - currentTop) * position.progress,
        behavior: "auto",
      });
    });
  });
}

export function OceanExperience({ children }: { children: React.ReactNode }) {
  const [activeDepth, setActiveDepth] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const activeDepthRef = useRef(0);
  const depthPositionRef = useRef(0);
  const fullscreenPositionRef = useRef<ChapterPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.add("is-enhanced");
    const sections = getChapterSections();
    const tones = Array.from(root.querySelectorAll<HTMLElement>(".ocean-environment__tone"));

    let frame = 0;
    let settleTimer: number | undefined;

    const update = () => {
      const scrollPosition = window.scrollY;
      let currentIndex = 0;

      sections.forEach((section, index) => {
        if (section.offsetTop <= scrollPosition + 2) currentIndex = index;
      });

      const currentSection = sections[currentIndex];
      const nextSection = sections[currentIndex + 1];
      const currentTop = currentSection?.offsetTop ?? 0;
      const nextTop = nextSection?.offsetTop ?? currentTop + window.innerHeight;
      const progress = nextSection
        ? clamp((scrollPosition - currentTop) / Math.max(nextTop - currentTop, 1), 0, 1)
        : 0;

      root.style.setProperty("--chapter-progress", progress.toFixed(4));
      root.style.setProperty("--chapter-index", String(currentIndex));
      depthPositionRef.current = currentIndex + progress;

      tones.forEach((tone, index) => {
        let opacity = 0;
        if (index === currentIndex) opacity = 1 - progress;
        if (index === currentIndex + 1) opacity = progress;
        if (index === currentIndex && !nextSection) opacity = 1;
        tone.style.opacity = String(opacity);
      });

      sections.forEach((section, index) => {
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;
        const visibility = isCurrent ? 1 - progress * 0.92 : isNext ? progress : 0;
        const shift = isCurrent ? progress * -28 : isNext ? (1 - progress) * 34 : 0;
        const blur = isCurrent ? progress * 7 : isNext ? (1 - progress) * 8 : 0;
        section.classList.toggle("is-active", isCurrent);
        section.classList.toggle("is-current", isCurrent);
        section.classList.toggle("is-next", isNext);
        section.classList.toggle("is-past", index < currentIndex);
        section.classList.toggle("is-future", index > currentIndex + 1);
        section.style.setProperty("--chapter-visibility", visibility.toFixed(4));
        section.style.setProperty("--chapter-shift", `${shift.toFixed(2)}px`);
        section.style.setProperty("--chapter-blur", `${blur.toFixed(2)}px`);
      });

      if (currentIndex !== activeDepthRef.current) {
        activeDepthRef.current = currentIndex;
        setActiveDepth(currentIndex);
      }
    };

    const settle = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const nearestSection = sections.reduce((nearest, section) =>
        Math.abs(section.offsetTop - window.scrollY) < Math.abs(nearest.offsetTop - window.scrollY)
          ? section
          : nearest
      );
      const nearestTop = nearestSection.offsetTop;
      const distance = Math.abs(window.scrollY - nearestTop);
      const threshold = window.innerWidth <= 820 ? 0.05 : 0.08;
      if (distance > 2 && distance <= window.innerHeight * threshold) {
        window.scrollTo({ top: nearestTop, behavior: "smooth" });
      }
    };

    const scheduleSettle = () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 220);
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
      scheduleSettle();
    };

    const handleResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    const targetId = window.location.hash.slice(1);
    const hashTimer = targetId
      ? window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView(), 180)
      : undefined;

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (settleTimer) window.clearTimeout(settleTimer);
      if (hashTimer) window.clearTimeout(hashTimer);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleFullscreenChange = () => {
      const nativeFullscreen = document.fullscreenElement !== null;
      const fallbackFullscreen = root.classList.contains("is-immersive-fallback");
      setIsImmersive(nativeFullscreen || fallbackFullscreen);
      const position = fullscreenPositionRef.current;
      fullscreenPositionRef.current = null;
      if (position) restoreChapterPosition(position);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.body.classList.remove("ocean-immersive-fallback");
    };
  }, []);

  const toggleImmersive = async () => {
    const root = rootRef.current;
    if (!root) return;
    const position = captureChapterPosition();
    fullscreenPositionRef.current = position;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (root.classList.contains("is-immersive-fallback")) {
      root.classList.remove("is-immersive-fallback");
      document.body.classList.remove("ocean-immersive-fallback");
      setIsImmersive(false);
      fullscreenPositionRef.current = null;
      restoreChapterPosition(position);
      return;
    }

    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        return;
      } catch {
        // Fall back to a page-contained immersive mode when native fullscreen is unavailable.
      }
    }

    root.classList.toggle("is-immersive-fallback");
    document.body.classList.toggle(
      "ocean-immersive-fallback",
      root.classList.contains("is-immersive-fallback")
    );
    setIsImmersive(root.classList.contains("is-immersive-fallback"));
    fullscreenPositionRef.current = null;
    restoreChapterPosition(position);
  };

  return (
    <div ref={rootRef} className="ocean-home" data-depth={DEPTHS[activeDepth]}>
      <div className="ocean-environment" aria-hidden="true">
        {DEPTHS.map((depth) => (
          <span
            key={depth}
            className={`ocean-environment__tone ocean-environment__tone--${depth}`}
          />
        ))}
        <span className="ocean-environment__current" />
      </div>
      <BioluminescentField depthPositionRef={depthPositionRef} />
      <button
        type="button"
        className="ocean-fullscreen-toggle"
        onClick={toggleImmersive}
        aria-label={isImmersive ? "退出全屏" : "进入全屏"}
        aria-pressed={isImmersive}
        title={isImmersive ? "退出全屏" : "进入全屏"}
      >
        {isImmersive ? (
          <Minimize2 size={17} aria-hidden="true" />
        ) : (
          <Maximize2 size={17} aria-hidden="true" />
        )}
      </button>
      {children}
    </div>
  );
}
