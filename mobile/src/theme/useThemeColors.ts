import { useColorScheme } from 'nativewind';
import { colors } from './colors';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { semanticHex } = require('./tokens.cjs') as {
  semanticHex: (mode: 'light' | 'dark') => Record<string, string>;
};

const light = semanticHex('light');
const dark = semanticHex('dark');

/**
 * Mode-aware colors for RN `color=`/style props (lucide icons, gradients,
 * shadowColor) where Tailwind classes don't apply.
 *
 * Returns the semantic neutrals for the active theme PLUS the constant brand
 * accents from `colors`. Use `c.textPrimary` where you'd have used
 * `colors.navy` as a neutral; keep `colors.teal` etc. for accents (also exposed
 * here as `c.teal`, so a component can pull everything from one object).
 */
export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const neutrals = colorScheme === 'dark' ? dark : light;
  return { ...colors, ...neutrals, isDark: colorScheme === 'dark' } as typeof colors &
    (typeof light) & { isDark: boolean };
}

export type ThemeColors = ReturnType<typeof useThemeColors>;
