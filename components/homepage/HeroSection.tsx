"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import StaticHeroFallback from "./StaticHeroFallback";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <StaticHeroFallback />,
});

const SERVICE_CARDS = [
  { labelKey: "moving", image: "/services/demenagement.png", slug: "demenagement-tunis", large: true },
  { labelKey: "furniture", image: "/services/furniture.png", slug: "transport-meuble-tunis", large: true },
  { labelKey: "intercity", image: "/services/intervilles.png", slug: "livraison-tunis-sfax", large: false },
  { labelKey: "office", image: "/services/bureaux.png", slug: "demenagement-bureaux", large: false },
  { labelKey: "express", image: "/services/express.png", slug: "livraison-express", large: false },
] as const;

export default function HeroSection() {
  const t = useTranslations("hero");
  const tServices = useTranslations("services");
  const locale = useLocale();

  return (
    <section id="hero" className="bg-vanz-navy relative overflow-hidden">
      {/* 3D Background */}
      <HeroScene />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-6 items-start">
          {/* Left — Text */}
          <motion.div
            className="flex flex-col justify-center pt-4 md:pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
              {t("title")}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-md mb-8 leading-relaxed">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href={`/${locale}/nouveau-job`}><motion.div className="px-7 py-3.5 bg-vanz-yellow text-vanz-navy font-bold text-base rounded-full hover:brightness-110 transition-colors shadow-lg shadow-black/10 inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t("cta1")}</motion.div></Link>
              <Link href={`/${locale}/devenir-chauffeur`}>
                <motion.div
                  className="px-7 py-3.5 bg-white text-vanz-navy font-bold text-base rounded-full hover:bg-white/90 transition-colors shadow-lg shadow-black/10 inline-block"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("cta2")}
                </motion.div>
              </Link>
            </div>

            {/* Trust Badges */}
            <motion.div
              className="flex flex-wrap gap-x-5 gap-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {(["trustBadge1", "trustBadge2", "trustBadge3", "trustBadge4"] as const).map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-vanz-yellow" />
                  {t(badge)}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Image Grid (AnyVan Style: 2 large + 3 small) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Top 2 large cards */}
              {SERVICE_CARDS.filter(c => c.large).map((card) => (
                <ServiceCard
                  key={card.labelKey}
                  label={tServices(card.labelKey)}
                  image={card.image}
                  large
                  href={`/${locale}/${card.slug}`}
                />
              ))}
              {/* Bottom 3 small cards */}
              <div className="col-span-2 grid grid-cols-3 gap-3">
                {SERVICE_CARDS.filter(c => !c.large).map((card) => (
                  <ServiceCard
                    key={card.labelKey}
                    label={tServices(card.labelKey)}
                    image={card.image}
                    large={false}
                    href={`/${locale}/${card.slug}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ label, image, large, href }: { label: string; image: string; large: boolean; href: string }) {
  return (
    <Link href={href} className="group relative rounded-2xl overflow-hidden bg-vanz-yellow shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full">
      {/* Image */}
      <div className={`relative w-full ${large ? "aspect-[4/3]" : "aspect-square"}`}>
        <Image
          src={image}
          alt={label}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={large ? "(max-width: 768px) 50vw, 25vw" : "(max-width: 768px) 33vw, 16vw"}
        />
      </div>
      {/* Label Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white">
        <span className="font-semibold text-vanz-navy text-sm truncate">{label}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-vanz-teal group-hover:translate-x-0.5 rtl:rotate-180 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}
