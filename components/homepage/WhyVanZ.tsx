"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CircleDollarSign, ShieldCheck, Zap, Lock } from "lucide-react";

export default function WhyVanZ() {
  const t = useTranslations("whyVanz");

  const features = [
    { key: "feature1", icon: CircleDollarSign, color: "text-vanz-teal", bg: "bg-vanz-teal/10" },
    { key: "feature2", icon: ShieldCheck, color: "text-vanz-green", bg: "bg-vanz-green/10" },
    { key: "feature3", icon: Zap, color: "text-vanz-yellow", bg: "bg-vanz-yellow/10" },
    { key: "feature4", icon: Lock, color: "text-purple-500", bg: "bg-purple-50" },
  ] as const;

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left Content — 3/5 */}
          <motion.div
            className="md:col-span-3 order-2 md:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-vanz-navy mb-3">
              {t("title")}
            </h2>
            <p className="text-gray-500 text-lg mb-10">
              {t("subtitle")}
            </p>

            <div className="space-y-6">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.key}
                  className="flex gap-4 items-start group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feat.icon className={`w-6 h-6 ${feat.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-vanz-navy text-lg mb-1">
                      {t(`${feat.key}Title`)}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {t(`${feat.key}Desc`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Phone Mockup 2/5 */}
          <motion.div
            className="md:col-span-2 flex justify-center order-1 md:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative w-56 sm:w-64">
              {/* Phone Frame */}
              <div className="relative bg-vanz-navy rounded-[2.5rem] p-3 shadow-2xl shadow-vanz-navy/30">
                <div className="bg-gradient-to-br from-vanz-teal/20 via-vanz-navy-light to-vanz-yellow/10 rounded-[2rem] overflow-hidden aspect-[9/18]">
                  {/* Notch */}
                  <div className="flex justify-center pt-3 pb-6">
                    <div className="w-20 h-5 bg-vanz-navy rounded-full" />
                  </div>

                  {/* Screen Content */}
                  <div className="px-4 space-y-3">
                    {/* App Bar */}
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-4 bg-white/20 rounded-full" />
                      <div className="w-6 h-6 bg-vanz-teal/30 rounded-full" />
                    </div>

                    {/* Search */}
                    <div className="w-full h-10 bg-white/10 rounded-xl border border-white/10" />

                    {/* Cards */}
                    <div className="space-y-2.5">
                      <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                        <div className="flex gap-2 items-center mb-2">
                          <div className="w-8 h-8 rounded-lg bg-vanz-teal/30" />
                          <div className="flex-1">
                            <div className="w-20 h-2.5 bg-white/30 rounded-full mb-1.5" />
                            <div className="w-14 h-2 bg-white/15 rounded-full" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="w-16 h-5 bg-vanz-yellow/30 rounded-full" />
                          <div className="w-8 h-2 bg-white/15 rounded-full" />
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                        <div className="flex gap-2 items-center mb-2">
                          <div className="w-8 h-8 rounded-lg bg-vanz-green/30" />
                          <div className="flex-1">
                            <div className="w-24 h-2.5 bg-white/30 rounded-full mb-1.5" />
                            <div className="w-12 h-2 bg-white/15 rounded-full" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="w-14 h-5 bg-vanz-teal/30 rounded-full" />
                          <div className="w-10 h-2 bg-white/15 rounded-full" />
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                        <div className="flex gap-2 items-center">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/30" />
                          <div className="flex-1">
                            <div className="w-18 h-2.5 bg-white/30 rounded-full mb-1.5" />
                            <div className="w-10 h-2 bg-white/15 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 ltr:-right-4 rtl:-left-4 px-3 py-1.5 bg-vanz-green text-white text-xs font-bold rounded-full shadow-lg animate-[float_3s_ease-in-out_infinite]">
                4.8★
              </div>
              <div className="absolute bottom-16 ltr:-left-6 rtl:-right-6 px-3 py-1.5 bg-vanz-yellow text-vanz-navy text-xs font-bold rounded-full shadow-lg animate-[float_3.5s_ease-in-out_infinite_0.5s]">
                -30%
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
