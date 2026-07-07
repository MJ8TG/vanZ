/**
 * Single source of truth for the VanZ palette.
 *
 * Consumed by BOTH tailwind.config.js (via require, to build the `vanz-*`
 * classes) and TypeScript (via theme/colors.ts, for RN `color=`/style props
 * where Tailwind classes don't apply — lucide icons, gradients, shadowColor…).
 * Keep hex values here and nowhere else.
 */
const palette = {
  // Brand
  teal: '#38B6FF',
  tealDark: '#2196D6',
  tealGlow: '#38B6FF33',
  yellow: '#F5C800',
  yellowDark: '#D4AD00',
  yellowGlow: '#F5C80033',
  navy: '#0B1021',
  navyLight: '#131B36',
  navyMid: '#1A2444',
  iceblue: '#F0F6FA',
  iceblueDark: '#E4EDF3',
  green: '#22C55E',
  greenDark: '#16A34A',
  cardGlass: 'rgba(255,255,255,0.92)',

  // Neutrals (the grays that recur across icon/placeholder props)
  white: '#FFFFFF',
  slate: '#94A3B8',
  muted: '#5B6B7F',
  steel: '#8A9AAB',
  mist: '#9AB0C4',
  placeholder: '#9CA3AF',
};

/** Maps the camelCase palette to the tailwind `vanz-*` token names. */
const tailwindVanz = {
  teal: palette.teal,
  'teal-dark': palette.tealDark,
  'teal-glow': palette.tealGlow,
  yellow: palette.yellow,
  'yellow-dark': palette.yellowDark,
  'yellow-glow': palette.yellowGlow,
  navy: palette.navy,
  'navy-light': palette.navyLight,
  'navy-mid': palette.navyMid,
  iceblue: palette.iceblue,
  'iceblue-dark': palette.iceblueDark,
  green: palette.green,
  'green-dark': palette.greenDark,
  'card-glass': palette.cardGlass,
};

/**
 * Semantic (role-based) tokens that FLIP between light and dark mode.
 *
 * Values are space-separated RGB channels so tailwind can apply opacity
 * modifiers via `rgb(var(--token) / <alpha-value>)`. These are the ONLY colors
 * that change with the theme — brand accents (teal, yellow, green) stay
 * constant in both modes and live in `palette`/`tailwindVanz` above.
 *
 * Consumed three ways off this single source:
 *   1. global.css `:root` (light defaults for first paint)
 *   2. `vars()` at the app root (runtime light/dark switch) — see useTheme
 *   3. useThemeColors() for RN `color=`/style props (icons, gradients)
 */
const semantic = {
  light: {
    surface: '240 246 250',          // page bg — iceblue
    'surface-elevated': '255 255 255', // cards — white
    'surface-sunken': '228 237 243',   // inset chips/inputs — iceblue-dark
    inverted: '11 16 33',              // navy pill/avatar fill
    'text-primary': '11 16 33',        // navy
    'text-secondary': '91 107 127',    // muted
    'text-muted': '148 163 184',       // slate
    'text-inverted': '255 255 255',    // white (on inverted fill)
    'border-default': '236 239 243',   // hairline
    'border-strong': '226 231 236',
    // Semantic status roles — used as `text-danger` / `bg-danger/10` /
    // `border-danger/30` etc. so one saturated color yields text + tint + border.
    danger: '239 68 68',               // red-500
    success: '34 197 94',              // green-500 (brand green)
    warning: '245 158 11',             // amber-500
  },
  dark: {
    surface: '11 16 33',               // page bg — navy
    'surface-elevated': '19 27 54',    // cards — navy-light
    'surface-sunken': '23 32 54',      // inset — subtle raise
    // Inverted is a navy brand fill (pills/avatars/buttons). In dark it must sit
    // ABOVE the page (11 16 33) and cards (19 27 54) or it vanishes, so use a
    // lifted mid-navy — still dark enough for white/yellow accent text to read.
    inverted: '34 46 74',              // lifted mid-navy for visibility on dark
    'text-primary': '240 246 250',     // near-white
    'text-secondary': '154 176 196',   // mist
    'text-muted': '110 127 146',
    'text-inverted': '255 255 255',    // white (on the navy inverted fill)
    'border-default': '36 48 76',
    'border-strong': '46 59 89',
    // Lighter/brighter status hues so they read on the dark surfaces.
    danger: '248 113 113',             // red-400
    success: '74 222 128',             // green-400
    warning: '251 191 36',             // amber-400
  },
};

/** `"240 246 250"` -> `"#F0F6FA"` for RN `color=` props that can't use classes. */
function tripletToHex(triplet) {
  return (
    '#' +
    triplet
      .split(' ')
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** camelCase hex view of the semantic tokens, per mode, for useThemeColors(). */
function semanticHex(mode) {
  const src = semantic[mode];
  return {
    surface: tripletToHex(src.surface),
    surfaceElevated: tripletToHex(src['surface-elevated']),
    surfaceSunken: tripletToHex(src['surface-sunken']),
    inverted: tripletToHex(src.inverted),
    textPrimary: tripletToHex(src['text-primary']),
    textSecondary: tripletToHex(src['text-secondary']),
    textMuted: tripletToHex(src['text-muted']),
    textInverted: tripletToHex(src['text-inverted']),
    border: tripletToHex(src['border-default']),
    borderStrong: tripletToHex(src['border-strong']),
    danger: tripletToHex(src.danger),
    success: tripletToHex(src.success),
    warning: tripletToHex(src.warning),
  };
}

module.exports = { palette, tailwindVanz, semantic, semanticHex, tripletToHex };
