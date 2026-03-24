"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const CITY_KEYS = [
  "tunis", "sousse", "sfax", "monastir", "bizerte", "nabeul",
  "ariana", "benArous", "laMarsa", "manouba", "gabes",
] as const;

export default function CitiesGrid() {
  const t = useTranslations("cities");

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-vanz-navy mb-4">
            {t("title")}
          </h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-vanz-teal to-cyan-400 rounded-full mx-auto" />
        </motion.div>

        {/* City Chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 md:gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {CITY_KEYS.map((key, i) => (
            <motion.button
              key={key}
              className="group flex items-center gap-2 px-5 py-3 bg-vanz-ice border-2 border-transparent hover:border-vanz-teal rounded-full text-vanz-navy font-medium text-sm md:text-base hover:bg-vanz-teal hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <MapPin className="w-4 h-4 text-vanz-teal group-hover:text-white transition-colors" />
              {t(key)}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
