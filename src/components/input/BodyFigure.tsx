"use client";

export type FeverLevel = "none" | "normal" | "mild" | "high";

export function feverOf(temp: string): FeverLevel {
  const tv = parseFloat(temp);
  if (isNaN(tv)) return "none";
  if (tv >= 38) return "high";
  if (tv >= 37) return "mild";
  return "normal";
}

export function bodyColorOf(level: FeverLevel): string {
  if (level === "high") return "#e57368";
  if (level === "mild") return "#eba53f";
  return "#8ec6ec";
}

const t = { transition: "fill .4s ease" } as const;

/** 体温で色が変わる人体シルエットSVG */
export default function BodyFigure({ level }: { level: FeverLevel }) {
  const c = bodyColorOf(level);
  return (
    <svg
      data-testid="body-figure"
      data-fever={level}
      width="120"
      height="252"
      viewBox="0 0 120 252"
    >
      <circle cx="60" cy="26" r="20" fill={c} style={t} />
      <rect x="38" y="50" width="44" height="84" rx="20" fill={c} style={t} />
      <rect x="16" y="56" width="14" height="64" rx="7" transform="rotate(14 23 60)" fill={c} style={t} />
      <rect x="90" y="56" width="14" height="64" rx="7" transform="rotate(-14 97 60)" fill={c} style={t} />
      <rect x="42" y="132" width="15" height="116" rx="7" fill={c} style={t} />
      <rect x="63" y="132" width="15" height="116" rx="7" fill={c} style={t} />
    </svg>
  );
}
