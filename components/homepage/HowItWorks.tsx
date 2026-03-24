"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FileText, MessageSquare, Rocket } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      number: "01",
      icon: FileText,
      titleKey: "step1Title",
      descKey: "step1Desc",
      color: "from-vanz-teal to-cyan-400",
      shadow: "shadow-vanz-teal/20",
    },
    {
      number: "02",
      icon: MessageSquare,
      titleKey: "step2Title",
      descKey: "step2Desc",
      color: "from-vanz-yellow to-amber-400",
      shadow: "shadow-vanz-yellow/20",
    },
    {
      number: "03",
      icon: Rocket,
      titleKey: "step3Title",
      descKey: "step3Desc",
      color: "from-vanz-green to-emerald-400",
      shadow: "shadow-vanz-green/20",
    },
  ] as const;

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

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              {/* Connector Line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 ltr:left-[60%] rtl:right-[60%] w-full h-0.5 bg-gradient-to-r ltr:from-gray-200 ltr:to-transparent rtl:from-transparent rtl:to-gray-200" />
              )}

              <div className="relative bg-white p-8 rounded-3xl border-2 border-gray-100 hover:border-vanz-teal/30 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                {/* Number Badge */}
                <div className="absolute -top-4 ltr:right-6 rtl:left-6 px-3 py-1 bg-vanz-navy text-white text-xs font-bold rounded-full">
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg ${step.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Text */}
                <h3 className="text-xl lg:text-2xl font-bold text-vanz-navy mb-3">
                  {t(step.titleKey)}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
