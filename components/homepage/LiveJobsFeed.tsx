"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { MapPin, ArrowRight, Clock, Truck, Sofa, Package } from "lucide-react";

const MOCK_JOBS = [
  {
    id: 1,
    from: "Tunis",
    to: "Sousse",
    service: "furniture",
    minutesAgo: 5,
    icon: Sofa,
    color: "bg-vanz-teal",
  },
  {
    id: 2,
    from: "Ariana",
    to: "La Marsa",
    service: "moving",
    minutesAgo: 12,
    icon: Truck,
    color: "bg-blue-500",
  },
  {
    id: 3,
    from: "Sfax",
    to: "Monastir",
    service: "parcel",
    minutesAgo: 18,
    icon: Package,
    color: "bg-vanz-green",
  },
  {
    id: 4,
    from: "Ben Arous",
    to: "Manouba",
    service: "furniture",
    minutesAgo: 25,
    icon: Sofa,
    color: "bg-vanz-yellow",
  },
  {
    id: 5,
    from: "Bizerte",
    to: "Tunis",
    service: "moving",
    minutesAgo: 30,
    icon: Truck,
    color: "bg-purple-500",
  },
];

export default function LiveJobsFeed() {
  const t = useTranslations("jobs");
  const tServices = useTranslations("services");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <section className="py-16 md:py-24 bg-vanz-teal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="w-20 h-1.5 bg-white/40 rounded-full mx-auto" />
        </motion.div>

        {/* Swiper */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          dir={isRtl ? "rtl" : "ltr"}
          key={isRtl ? "rtl" : "ltr"}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-14 swiper-dark"
        >
          {MOCK_JOBS.map((job) => (
            <SwiperSlide key={job.id}>
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 transition-all duration-300 group cursor-pointer hover:-translate-y-1">
                {/* Service Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${job.color} text-white text-xs font-semibold rounded-full`}>
                    <job.icon className="w-3.5 h-3.5" />
                    {tServices(job.service)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {job.minutesAgo} {t("minutes")}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-vanz-teal flex-shrink-0" />
                    <span className="text-sm font-medium text-vanz-navy truncate">{job.from}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 rtl:rotate-180" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-vanz-green flex-shrink-0" />
                    <span className="text-sm font-medium text-vanz-navy truncate">{job.to}</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* View All */}
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <button className="px-6 py-3 text-white font-semibold border-2 border-white rounded-full hover:bg-white hover:text-vanz-teal transition-all duration-200">
            {t("viewAll")}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
