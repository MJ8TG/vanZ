// Typed access to the shared palette for RN style/`color=` props (lucide icons,
// gradients, shadowColor, etc.) where Tailwind classes don't apply. Hex values
// live only in tokens.cjs — this is the typed view of the same source.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { palette } = require('./tokens.cjs') as { palette: Record<string, string> };

export const colors = palette as {
  teal: string; tealDark: string; tealGlow: string;
  yellow: string; yellowDark: string; yellowGlow: string;
  navy: string; navyLight: string; navyMid: string;
  iceblue: string; iceblueDark: string;
  green: string; greenDark: string; cardGlass: string;
  white: string; slate: string; muted: string; steel: string; mist: string; placeholder: string;
};

export type ColorToken = keyof typeof colors;
