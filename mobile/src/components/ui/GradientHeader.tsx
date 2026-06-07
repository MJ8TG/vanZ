import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '@/i18n';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  /** Tall variant with more padding (default false) */
  tall?: boolean;
}

export default function GradientHeader({ 
  title, 
  subtitle, 
  backButton, 
  rightAction, 
  children,
  tall = false 
}: GradientHeaderProps) {
  const { locale } = useI18n();
  const isRtl = locale === 'ar';

  return (
    <LinearGradient
      colors={['#0B1021', '#131B36', '#1A2444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`${tall ? 'pt-14 pb-8' : 'pt-14 pb-6'} px-6`}
    >
      <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        {backButton && (
          <TouchableOpacity 
            onPress={backButton}
            className="w-11 h-11 bg-white/10 rounded-full items-center justify-center mr-4 ml-4 active:bg-white/20"
          >
            <Text className="text-white text-lg font-bold">{isRtl ? '→' : '←'}</Text>
          </TouchableOpacity>
        )}
        <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
          <Text className={`text-white text-2xl font-black ${isRtl ? 'text-right' : ''}`}>
            {title}
          </Text>
          {subtitle && (
            <Text className={`text-white/60 text-sm font-medium mt-1 leading-relaxed ${isRtl ? 'text-right' : ''}`}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && (
          <View className="ml-3 mr-3">
            {rightAction}
          </View>
        )}
      </View>
      {children}
    </LinearGradient>
  );
}
