import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { StylePreset } from "../types";

interface BackgroundProps {
  style: StylePreset;
  frame: number;
  fps: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  offset: number;
}

export const Background: React.FC<BackgroundProps> = ({ style, frame, fps }) => {
  const particles = useMemo(() => {
    if (!style.particles) return [];
    const seeds: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      seeds.push({
        id: i,
        x: (i * 137.508) % 100,
        y: (i * 53.147) % 100,
        size: 2 + (i % 4),
        speed: 0.3 + (i % 5) * 0.15,
        offset: i * 1.7,
      });
    }
    return seeds;
  }, [style.particles]);

  const t = frame / fps;

  let background: string;
  if (style.bgGradient) {
    const angle = 135 + Math.sin(t / 8) * 20;
    background = `linear-gradient(${angle}deg, ${style.bgGradient[0]}, ${style.bgGradient[1]})`;
  } else {
    background = style.bgColor;
  }

  return (
    <AbsoluteFill style={{ background }}>
      {particles.map((p) => {
        const px = p.x + Math.sin(t * p.speed + p.offset) * 5;
        const py = p.y + Math.cos(t * p.speed * 0.7 + p.offset) * 4;
        const opacity = interpolate(
          Math.sin(t * 0.5 + p.offset),
          [-1, 1],
          [0.2, 0.7],
        );

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: style.highlightColor,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
