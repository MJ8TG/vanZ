"use client";

import { useTranslations } from "next-intl";

export default function StaticHeroFallback() {
  const t = useTranslations("hero");

  return (
    <div className="absolute inset-0 w-full h-full bg-vanz-navy/50 flex flex-col items-center justify-center opacity-0 md:opacity-100 pointer-events-none z-0">
      {/* Fallback pattern or placeholder while Three.js loads */}
      <div className="w-full h-full custom-grid-pattern opacity-10"></div>
    </div>
  );
}
