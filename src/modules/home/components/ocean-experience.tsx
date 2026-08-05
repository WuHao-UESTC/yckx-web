"use client";

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

function particleColor(depth: number, particleIndex: number): string {
  if (depth === 0) {
    return particleIndex % 5 === 0 ? "242, 198, 109" : "224, 246, 252";
  }
  if (depth === 1) return particleIndex % 7 === 0 ? "143, 232, 210" : "166, 232, 245";
  if (depth === 2) return particleIndex % 4 === 0 ? "104, 207, 178" : "128, 216, 231";
  if (depth === 3) return "163, 218, 230";
  if (depth === 4) return particleIndex % 6 === 0 ? "242, 198, 109" : "127, 195, 210";
  return particleIndex % 3 === 0 ? "242, 198, 109" : "204, 234, 241";
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

function BioluminescentField({ activeDepth }: { activeDepth: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeDepthRef = useRef(activeDepth);

  useEffect(() => {
    activeDepthRef.current = activeDepth;
  }, [activeDepth]);

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

      const depth = activeDepthRef.current;
      const density = depth === 0 ? 0.62 : depth === 1 ? 1 : depth >= 4 ? 0.52 : 0.76;
      const visibleCount = Math.floor(particles.length * density);

      particles.slice(0, visibleCount).forEach((particle, index) => {
        if (!reducedMotion.matches) {
          particle.y -= particle.speed * elapsed * (depth === 0 ? 0.35 : 1);
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
        const color = particleColor(depth, index);

        if ((depth === 2 || depth === 3) && width >= 700 && index > 0 && index % 22 === 0) {
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

        if (depth > 0 && index % 9 === 0) {
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
  }, []);

  return <canvas ref={canvasRef} className="bioluminescent-field" aria-hidden="true" />;
}

export function OceanExperience({ children }: { children: React.ReactNode }) {
  const [activeDepth, setActiveDepth] = useState(0);
  const activeDepthRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.classList.add("is-enhanced");
    const sections = DEPTHS.map((depth) => document.getElementById(depth)).filter(
      (section): section is HTMLElement => Boolean(section)
    );

    let frame = 0;
    const update = () => {
      const viewportCenter = window.innerHeight / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const bounds = section.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height / 2 - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      sections.forEach((section, index) => {
        section.classList.toggle("is-active", index === nearestIndex);
        section.classList.toggle("is-past", index < nearestIndex);
        section.classList.toggle("is-future", index > nearestIndex);
      });

      if (nearestIndex !== activeDepthRef.current) {
        activeDepthRef.current = nearestIndex;
        setActiveDepth(nearestIndex);
      }
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    const targetId = window.location.hash.slice(1);
    const hashTimer = targetId
      ? window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView(), 180)
      : undefined;

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (hashTimer) window.clearTimeout(hashTimer);
    };
  }, []);

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
      <BioluminescentField activeDepth={activeDepth} />
      {children}
    </div>
  );
}
