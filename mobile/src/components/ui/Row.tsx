import { View, type ViewProps } from 'react-native';
import { useDirection } from '@/hooks/useDirection';

interface RowProps extends ViewProps {
  className?: string;
  /** Force direction regardless of locale. Default: follow reading direction (reverse in RTL). */
  reverse?: boolean;
}

/**
 * A horizontal flex container that follows the reading direction — reverses in
 * RTL automatically. Replaces the `flex-row ${isRtl ? 'flex-row-reverse' : ''}`
 * pattern. Pass `reverse` to override (rare).
 */
export default function Row({ className = '', reverse, children, ...rest }: RowProps) {
  const { isRtl } = useDirection();
  const rev = reverse ?? isRtl;
  return (
    <View className={`flex-row ${rev ? 'flex-row-reverse' : ''} ${className}`} {...rest}>
      {children}
    </View>
  );
}
