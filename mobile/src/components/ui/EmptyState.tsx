import { View, Text, Image, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  /** Brand illustration. Takes precedence over `Icon` when both are given. */
  image?: ImageSourcePropType;
  /** Fallback glyph when there's no illustration for this state. */
  Icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary action, e.g. "Publish your first job". */
  action?: { label: string; onPress: () => void };
  /** Driver mode is yellow-accented; client is teal. */
  accent?: 'teal' | 'yellow';
  /** Inline (inside a card/list) rather than filling the screen. */
  compact?: boolean;
}

/**
 * The single empty state for the app. Screens previously hand-rolled these,
 * which drifted (some had an illustration + title + copy, others just a bare
 * grey icon and one line). Everything here is theme-aware, so it reads on both
 * the white and navy-light surfaces.
 */
export default function EmptyState({
  image,
  Icon,
  title,
  description,
  action,
  accent = 'teal',
  compact = false,
}: EmptyStateProps) {
  const c = useThemeColors();
  const accentBg = accent === 'yellow' ? 'bg-vanz-yellow' : 'bg-vanz-teal';
  const accentText = accent === 'yellow' ? 'text-vanz-navy' : 'text-white';

  return (
    <Animated.View
      entering={FadeInDown.delay(60).springify()}
      className={`items-center justify-center px-10 ${compact ? 'py-12' : 'flex-1 pb-24'}`}
    >
      {image ? (
        <Image
          source={image}
          style={{ width: compact ? 120 : 180, height: compact ? 120 : 180 }}
          resizeMode="contain"
          className="mb-4"
        />
      ) : Icon ? (
        <View
          className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-surface-sunken items-center justify-center mb-4`}
        >
          <Icon size={compact ? 26 : 34} color={c.textMuted} strokeWidth={1.8} />
        </View>
      ) : null}

      <Text className={`text-content font-black ${compact ? 'text-base' : 'text-lg'} mb-1.5 text-center`}>
        {title}
      </Text>

      {description ? (
        <Text className="text-content-secondary font-medium text-sm text-center leading-relaxed">
          {description}
        </Text>
      ) : null}

      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          activeOpacity={0.85}
          className={`mt-5 px-6 h-12 rounded-2xl ${accentBg} items-center justify-center active:opacity-90`}
          style={{
            shadowColor: accent === 'yellow' ? colors.yellow : colors.teal,
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Text className={`${accentText} font-black text-sm`}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}
