import { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';

interface PremiumCardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

/** Glassmorphism container: frosted white surface, soft elevation, hairline border. */
export default function PremiumCard({ children, className = '', ...rest }: PremiumCardProps) {
  return (
    <View {...rest} className={`bg-card-glass rounded-3xl shadow-elevated border border-white/50 ${className}`}>
      {children}
    </View>
  );
}
