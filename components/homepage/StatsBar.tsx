"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Truck, Users, Star, Percent } from "lucide-react";

function useCountUp(end: number, duration: number = 2000, isDecimal: boolean = false) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = eased * end;
      setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration, isDecimal]);

  return { count, ref };
}

function StatItem({ stat, i }: { stat: any; i: number }) {
  const { count, ref } = useCountUp(stat.value, 2000 + i * 200, stat.isDecimal);
  return (
    <div
      ref={ref}
      className="text-center group"
    >
      <div className="flex items-center justify-center mb-2">
        <stat.icon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
      </div>
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1">
        {stat.prefix}{stat.isDecimal ? count.toFixed(1) : count}{stat.suffix}
      </div>
      <div className="text-sm sm:text-base text-white/70 font-medium">
        {stat.label}
      </div>
    </div>
  );
}

export default function StatsBar() {
  const t = useTranslations("stats");

  const stats = [
    { icon: Truck, value: 50, prefix: "+", suffix: "", label: t("jobs"), isDecimal: false },
    { icon: Users, value: 20, prefix: "+", suffix: "", label: t("drivers"), isDecimal: false },
    { icon: Star, value: 4.8, prefix: "", suffix: "★", label: t("rating"), isDecimal: true },
    { icon: Percent, value: 30, prefix: "", suffix: "%", label: t("savings"), isDecimal: false },
  ];

  return (
    <section className="bg-gradient-to-r from-vanz-teal to-cyan-500 py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <StatItem key={i} stat={stat} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
