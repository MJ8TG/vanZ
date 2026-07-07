import { colors } from '@/theme/colors';
import { ReactNode, useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import Row from '@/components/ui/Row';

interface PremiumInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function PremiumInput({ label, error, icon, secureTextEntry, ...rest }: PremiumInputProps) {
  const [focused, setFocused] = useState(false);
  const { locale } = useI18n();
  const isRtl = locale === 'ar';

  const borderColor = error ? 'border-red-400' : focused ? 'border-vanz-teal' : 'border-line';
  const bg = error ? 'bg-danger/5' : focused ? 'bg-vanz-teal/5' : 'bg-surface-elevated';

  return (
    <View>
      {label ? (
        <Text className={`text-content font-jakarta-bold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{label}</Text>
      ) : null}
      <Row className={`items-center rounded-2xl border-2 px-4 h-16 ${borderColor} ${bg}`}>
        {icon ? <View className={isRtl ? 'ml-3' : 'mr-3'}>{icon}</View> : null}
        <TextInput
          {...rest}
          secureTextEntry={secureTextEntry}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor={colors.placeholder}
          className={`flex-1 text-base text-content ${isRtl ? 'text-right' : ''}`}
        />
      </Row>
      {error ? (
        <Animated.Text entering={FadeIn} className={`text-danger text-xs font-jakarta-bold mt-1.5 ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}
