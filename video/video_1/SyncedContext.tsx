import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";

const CREAM = "#F5F3EE";
const INK = "#1A1A1A";
const INK_LIGHT = "#6B6B6B";
const ACCENT = "#C9A962";

const CX = 960;
const CY = 460;
const ORBIT_START = 340;
const ORBIT_END = 250;

const agents = [
  { id: 0, name: "Claude", angle: -90 },
  { id: 1, name: "Cursor", angle: 0 },
  { id: 2, name: "Codex", angle: 90 },
  { id: 3, name: "Windsurf", angle: 180 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function agentXY(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * radius, y: CY + Math.sin(rad) * radius };
}

// Single pulse traveling from agent to hub
function PulseCircle({
  startX,
  startY,
  frame,
  startFrame,
  travelDuration,
}: {
  startX: number;
  startY: number;
  frame: number;
  startFrame: number;
  travelDuration: number;
}) {
  const t = interpolate(frame, [startFrame, startFrame + travelDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (t <= 0 || t >= 1) return null;

  const x = lerp(startX, CX, t);
  const y = lerp(startY, CY, t);
  const opacity = interpolate(t, [0, 0.15, 0.75, 1], [0, 0.85, 0.85, 0]);

  return <circle cx={x} cy={y} r={4.5} fill={ACCENT} opacity={opacity} />;
}

export const SyncedContext: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Drift: agents move inward ---
  const driftT = interpolate(frame, [45, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const radius = lerp(ORBIT_START, ORBIT_END, driftT);

  // --- Hub appear (spring) ---
  const hubSpring = Math.min(
    spring({ frame: frame - 28, fps, config: { damping: 22, stiffness: 130, mass: 0.7 } }),
    1
  );

  // --- Hub breathe (after fully in) ---
  const breathe = frame > 55 ? 1 + Math.sin((frame - 55) * 0.12) * 0.035 : 1;

  // --- Glow ring fade in ---
  const glowOpacity = interpolate(frame, [55, 75], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Text: "Share" slides up ---
  const shareOpacity = interpolate(frame, [92, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const shareY = interpolate(frame, [92, 108], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- Text: "Context" slides up (delayed) ---
  const contextOpacity = interpolate(frame, [97, 113], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const contextY = interpolate(frame, [97, 113], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- Subtitle ---
  const subtitleOpacity = interpolate(frame, [104, 118], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, fontFamily: "system-ui, sans-serif" }}>
      {/* Grid */}
      <AbsoluteFill
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "60px 60px",
        }}
      />

      {/* SVG: lines + pulses */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {agents.map((agent) => {
          const pos = agentXY(agent.angle, radius);

          // Line draws from agent toward hub
          const lineT = interpolate(frame, [22 + agent.id * 7, 52 + agent.id * 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const lineEndX = lerp(pos.x, CX, lineT);
          const lineEndY = lerp(pos.y, CY, lineT);
          const lineOpacity = interpolate(lineT, [0, 0.25], [0, 0.3]);

          // Pulses: 2 per agent, staggered
          const pulse1Start = 58 + agent.id * 5;
          const pulse2Start = pulse1Start + 22;

          return (
            <g key={agent.id}>
              <line
                x1={pos.x}
                y1={pos.y}
                x2={lineEndX}
                y2={lineEndY}
                stroke={ACCENT}
                strokeWidth={2}
                opacity={lineOpacity}
              />
              <PulseCircle startX={pos.x} startY={pos.y} frame={frame} startFrame={pulse1Start} travelDuration={32} />
              <PulseCircle startX={pos.x} startY={pos.y} frame={frame} startFrame={pulse2Start} travelDuration={32} />
            </g>
          );
        })}
      </svg>

      {/* Hub glow */}
      <div
        style={{
          position: "absolute",
          left: CX - 68,
          top: CY - 68,
          width: 136,
          height: 136,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(201,169,98,0.22) 0%, transparent 70%)`,
          opacity: glowOpacity * hubSpring,
          transform: `scale(${breathe})`,
        }}
      />

      {/* Hub node */}
      <div
        style={{
          position: "absolute",
          left: CX - 38,
          top: CY - 38,
          width: 76,
          height: 76,
          borderRadius: "50%",
          backgroundColor: ACCENT,
          opacity: Math.min(hubSpring, 1),
          transform: `scale(${hubSpring * breathe})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(201,169,98,0.3)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "0.08em" }}>
          CLEAN
        </span>
      </div>

      {/* Agent nodes */}
      {agents.map((agent) => {
        const appearSpring = Math.min(
          spring({ frame: frame - agent.id * 9, fps, config: { damping: 20, stiffness: 150, mass: 0.6 } }),
          1
        );
        const pos = agentXY(agent.angle, radius);
        const opacity = interpolate(appearSpring, [0, 0.35], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={agent.id}
            style={{
              position: "absolute",
              left: pos.x - 42,
              top: pos.y - 42,
              width: 84,
              height: 84,
              opacity,
              transform: `scale(${appearSpring})`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                backgroundColor: "white",
                border: `2px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 14px rgba(0,0,0,0.09)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{agent.name}</span>
            </div>
          </div>
        );
      })}

      {/* Text reveal at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", gap: 22, justifyContent: "center", alignItems: "baseline" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: INK,
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.02em",
              opacity: shareOpacity,
              transform: `translateY(${shareY}px)`,
            }}
          >
            Share
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: ACCENT,
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.02em",
              opacity: contextOpacity,
              transform: `translateY(${contextY}px)`,
            }}
          >
            Context
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            color: INK_LIGHT,
            marginTop: 18,
            opacity: subtitleOpacity,
            letterSpacing: "0.01em",
          }}
        >
          Every agent, one shared understanding.
        </div>
      </div>
    </AbsoluteFill>
  );
};
