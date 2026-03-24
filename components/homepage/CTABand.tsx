"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CTABand() {
  const t = useTranslations("cta");
  const locale = useLocale();

  return (
    <section className="py-16 md:py-20 bg-vanz-yellow relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, #0B1021 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-vanz-navy mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          {t("title")}
        </motion.h2>

        <motion.p
          className="text-lg text-vanz-navy/70 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link href={`/${locale}/download`}>
            <motion.div
              className="inline-block px-8 py-4 bg-vanz-navy text-white font-bold text-lg rounded-full hover:bg-vanz-navy-light hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-vanz-navy/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("button1")}
            </motion.div>
          </Link>
          <Link href={`/${locale}/devenir-chauffeur`}>
            <motion.div
              className="inline-block px-8 py-4 border-2 border-vanz-navy text-vanz-navy font-semibold text-lg rounded-full hover:bg-vanz-navy/10 hover:scale-105 active:scale-95 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("button2")}
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
