import HeroSection from "@/components/homepage/HeroSection";
import StatsBar from "@/components/homepage/StatsBar";
import HowItWorks from "@/components/homepage/HowItWorks";
import ServicesGrid from "@/components/homepage/ServicesGrid";
import WhyVanZ from "@/components/homepage/WhyVanZ";
import LiveJobsFeed from "@/components/homepage/LiveJobsFeed";
import ReviewsSection from "@/components/homepage/ReviewsSection";
import CitiesGrid from "@/components/homepage/CitiesGrid";
import CTABand from "@/components/homepage/CTABand";
import JsonLd from "@/components/seo/JsonLd";

import { setRequestLocale } from "next-intl/server";
import { use } from "react";

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "VanZ",
    "image": "https://vanz.tn/logo-vanz.png",
    "url": "https://vanz.tn",
    "telephone": "+21655000000",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tunis",
      "addressCountry": "Tunisia"
    }
  };

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <ServicesGrid />
        <WhyVanZ />
        <LiveJobsFeed />
        <ReviewsSection />
        <CitiesGrid />
        <CTABand />
      </main>
    </>
  );
}
