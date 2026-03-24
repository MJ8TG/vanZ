"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Star, Quote } from "lucide-react";

const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Ahmed B.",
    city: { fr: "Tunis", ar: "\u062A\u0648\u0646\u0633" },
    stars: 5,
    comment: {
      fr: "Service exceptionnel ! Le chauffeur est arrivé à l'heure et a pris soin de tous mes meubles. Je recommande vivement.",
      ar: "\u062E\u062F\u0645\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629! \u0648\u0635\u0644 \u0627\u0644\u0633\u0627\u0626\u0642 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u062D\u062F\u062F \u0648\u0627\u0647\u062A\u0645 \u0628\u062C\u0645\u064A\u0639 \u0623\u062B\u0627\u062B\u064A. \u0623\u0646\u0635\u062D \u0628\u0634\u062F\u0629.",
    },
    color: "bg-vanz-teal",
  },
  {
    id: 2,
    name: "Fatma M.",
    city: { fr: "Sousse", ar: "\u0633\u0648\u0633\u0629" },
    stars: 5,
    comment: {
      fr: "Déménagement complet en une demi-journée. Prix très compétitif par rapport aux autres. Merci VanZ !",
      ar: "\u0646\u0642\u0644 \u0643\u0627\u0645\u0644 \u0641\u064A \u0646\u0635\u0641 \u064A\u0648\u0645. \u0633\u0639\u0631 \u062A\u0646\u0627\u0641\u0633\u064A \u062C\u062F\u0627\u064B \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0622\u062E\u0631\u064A\u0646. \u0634\u0643\u0631\u0627\u064B VanZ!",
    },
    color: "bg-vanz-yellow",
  },
  {
    id: 3,
    name: "Karim S.",
    city: { fr: "Sfax", ar: "\u0635\u0641\u0627\u0642\u0633" },
    stars: 4,
    comment: {
      fr: "Très pratique pour envoyer des colis entre villes. L'application est simple et les chauffeurs sont fiables.",
      ar: "\u0639\u0645\u0644\u064A \u062C\u062F\u0627\u064B \u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0631\u0648\u062F \u0628\u064A\u0646 \u0627\u0644\u0645\u062F\u0646. \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0633\u064A\u0637 \u0648\u0627\u0644\u0633\u0627\u0626\u0642\u0648\u0646 \u0645\u0648\u062B\u0648\u0642\u0648\u0646.",
    },
    color: "bg-vanz-green",
  },
  {
    id: 4,
    name: "Salma R.",
    city: { fr: "Ariana", ar: "\u0623\u0631\u064A\u0627\u0646\u0629" },
    stars: 5,
    comment: {
      fr: "J'ai économisé presque 40% par rapport au prix du marché. Le système d'enchères est génial !",
      ar: "\u0648\u0641\u0651\u0631\u062A \u062A\u0642\u0631\u064A\u0628\u0627\u064B 40% \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0633\u0639\u0631 \u0627\u0644\u0633\u0648\u0642. \u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u0631\u0627\u0626\u0639!",
    },
    color: "bg-purple-500",
  },
  {
    id: 5,
    name: "Mohamed T.",
    city: { fr: "Bizerte", ar: "\u0628\u0646\u0632\u0631\u062A" },
    stars: 5,
    comment: {
      fr: "Livraison express d'un colis urgent. Le chauffeur a été très professionnel. Top service !",
      ar: "\u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0644\u0637\u0631\u062F \u0639\u0627\u062C\u0644. \u0643\u0627\u0646 \u0627\u0644\u0633\u0627\u0626\u0642 \u0645\u062D\u062A\u0631\u0641\u0627\u064B \u062C\u062F\u0627\u064B. \u062E\u062F\u0645\u0629 \u0645\u0645\u062A\u0627\u0632\u0629!",
    },
    color: "bg-orange-500",
  },
];

export default function ReviewsSection() {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <section className="py-16 md:py-24 bg-vanz-navy relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-vanz-teal/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            {t("title")}
          </h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-vanz-yellow to-amber-400 rounded-full mx-auto" />
        </motion.div>

        {/* Swiper */}
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          dir={isRtl ? "rtl" : "ltr"}
          key={isRtl ? "rtl" : "ltr"}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-14 swiper-dark"
        >
          {MOCK_REVIEWS.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-vanz-teal/20 mb-3" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < review.stars ? "text-vanz-yellow fill-vanz-yellow" : "text-gray-200"}`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[80px]">
                  {review.comment[locale as "fr" | "ar"]}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-vanz-navy text-sm">{review.name}</p>
                    <p className="text-gray-400 text-xs">{review.city[locale as "fr" | "ar"]}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
