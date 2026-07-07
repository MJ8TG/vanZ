import { colors } from '@/theme/colors';
import { ReactNode } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function PremiumButton({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  style,
}: PremiumButtonProps) {
  const inactive = disabled || isLoading;

  const handlePress = () => {
    if (inactive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const textColor =
    variant === 'primary' ? 'text-white' : variant === 'outline' ? 'text-vanz-teal' : 'text-content';

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.navy} />
      ) : (
        <>
          {icon}
          <Text className={`text-base font-jakarta-bold ${textColor}`}>{title}</Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={inactive}
        style={style}
        className={`w-full h-16 rounded-2xl overflow-hidden ${inactive ? '' : 'shadow-glow-teal'}`}
      >
        <LinearGradient
          colors={inactive ? ['#38B6FF80', '#2196D680'] : [colors.teal, colors.tealDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="w-full h-full items-center justify-center"
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={inactive}
      style={style}
      className={`w-full h-16 rounded-2xl items-center justify-center ${
        variant === 'outline' ? 'border-2 border-vanz-teal bg-transparent' : 'bg-surface-elevated shadow-card'
      } ${inactive ? 'opacity-60' : ''}`}
    >
      {content}
    </TouchableOpacity>
  );
}
