import { useI18n } from '@/i18n';

/**
 * Centralizes layout direction so screens stop hand-writing
 * `isRtl ? 'flex-row-reverse' : ''` (and friends) everywhere.
 *
 * - `isRtl`      — current locale is Arabic.
 * - `rowReverse` — className to reverse a flex-row in RTL.
 * - `textAlign`  — className to right-align text in RTL.
 * - `itemsEnd`   — className to end-align a column's children in RTL.
 * - `flip(a, b)` — pick `a` in LTR, `b` in RTL (for any value, not just classes).
 */
export function useDirection() {
  const { locale } = useI18n();
  const isRtl = locale === 'ar';
  return {
    isRtl,
    rowReverse: isRtl ? 'flex-row-reverse' : '',
    textAlign: isRtl ? 'text-right' : '',
    itemsEnd: isRtl ? 'items-end' : '',
    flip: <T,>(ltr: T, rtl: T): T => (isRtl ? rtl : ltr),
  };
}
