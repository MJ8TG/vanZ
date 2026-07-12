import { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';

interface PremiumCardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

/** Elevated container: themed surface, soft elevation, hairline border. */
export default function PremiumCard({ children, className = '', ...rest }: PremiumCardProps) {
  return (
    <View {...rest} className={`bg-surface-elevated rounded-3xl shadow-elevated border border-line ${className}`}>
      {children}
    </View>
  );
}
