import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface VanzLogoProps {
  /** Height of the mark in px; wordmark scales from it. */
  size?: number;
  /** Force a white wordmark (for fixed dark backgrounds like the navy hero).
   *  When omitted, the wordmark follows the theme (navy in light, white in dark). */
  onDark?: boolean;
}

/**
 * VanZ brand lockup — faithful recreation of the prototype's Mark + Wordmark
 * (VanZApp.jsx). Drawn in SVG so it stays crisp and recolors per background,
 * since the bundled PNGs are square/clipped or white-only.
 */
export default function VanzLogo({ size = 30, onDark }: VanzLogoProps) {
  const c = useThemeColors();
  const word = onDark ? '#FFFFFF' : c.textPrimary;
  const fontSize = Math.round(size * 0.72);
  return (
    // direction:'ltr' + explicit flexDirection keep the brand lockup from
    // mirroring to "zvan" when the app is in RTL (Arabic).
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, direction: 'ltr' }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Rect x={0} y={0} width={64} height={64} rx={14} fill={colors.teal} />
        {/* speed lines */}
        <Rect x={24} y={14} width={22} height={2.6} rx={1.3} fill="#fff" />
        <Rect x={30} y={19} width={16} height={2.6} rx={1.3} fill="#fff" />
        {/* van silhouette */}
        <Path
          d="M10 32 L10 47 Q10 50 13 50 L19 50 Q20 45 24.5 45 Q29 45 30 50 L42 50 Q42 36 36 32 L24 32 Q22 32 21 33 L17 36 Q15 37 13 37 L10 37 Z"
          fill="#fff"
        />
        <Circle cx={24.5} cy={50} r={3.2} fill="#fff" stroke={colors.teal} strokeWidth={1.4} />
        {/* yellow lightning Z */}
        <Path d="M44 18 L36 36 L43 36 L37 52 L52 32 L45 32 L52 18 Z" fill={colors.yellow} />
      </Svg>
      <Text style={{ fontSize, fontWeight: '900', letterSpacing: -0.5 }}>
        <Text style={{ color: word }}>van</Text>
        <Text style={{ color: colors.yellow }}>z</Text>
      </Text>
    </View>
  );
}
