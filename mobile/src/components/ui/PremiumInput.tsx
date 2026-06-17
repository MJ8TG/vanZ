import { ReactNode, useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useI18n } from '@/i18n';

interface PremiumInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function PremiumInput({ label, error, icon, secureTextEntry, ...rest }: PremiumInputProps) {
  const [focused, setFocused] = useState(false);
  const { locale } = useI18n();
  const isRtl = locale === 'ar';

  const borderColor = error ? 'border-red-400' : focused ? 'border-vanz-teal' : 'border-gray-100';
  const bg = error ? 'bg-red-50/40' : focused ? 'bg-vanz-teal/5' : 'bg-white';

  return (
    <View>
      {label ? (
        <Text className={`text-vanz-navy font-jakarta-bold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{label}</Text>
      ) : null}
      <View className={`flex-row items-center rounded-2xl border-2 px-4 h-16 ${borderColor} ${bg} ${isRtl ? 'flex-row-reverse' : ''}`}>
        {icon ? <View className={isRtl ? 'ml-3' : 'mr-3'}>{icon}</View> : null}
        <TextInput
          {...rest}
          secureTextEntry={secureTextEntry}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor="#9CA3AF"
          className={`flex-1 text-base text-vanz-navy ${isRtl ? 'text-right' : ''}`}
        />
      </View>
      {error ? (
        <Animated.Text entering={FadeIn} className={`text-red-500 text-xs font-jakarta-bold mt-1.5 ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}
