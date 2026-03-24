"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const SERVICES = [
  { key: "moving", descKey: "movingDesc", image: "/services/demenagement.png" },
  { key: "furniture", descKey: "furnitureDesc", image: "/services/furniture.png" },
  { key: "parcel", descKey: "parcelDesc", image: "/services/colis.png" },
  { key: "intercity", descKey: "intercityDesc", image: "/services/intervilles.png" },
  { key: "office", descKey: "officeDesc", image: "/services/bureaux.png" },
  { key: "express", descKey: "expressDesc", image: "/services/express.png" },
] as const;

export default function ServicesGrid() {
  const t = useTranslations("services");

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          className="text-center mb-12 md:mb-16"
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

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => (
            <motion.button
              key={service.key}
              className="group relative bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-vanz-teal/30 shadow-sm hover:shadow-xl transition-all duration-300 text-start hover:-translate-y-1"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-vanz-yellow overflow-hidden">
                <Image
                  src={service.image}
                  alt={t(service.key)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Text */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-vanz-navy group-hover:text-vanz-teal transition-colors duration-200">
                    {t(service.key)}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-vanz-teal group-hover:translate-x-1 rtl:rotate-180 transition-all flex-shrink-0" />
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t(service.descKey)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
