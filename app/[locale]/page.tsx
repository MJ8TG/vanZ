import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import StatsBar from "@/components/homepage/StatsBar";
import HowItWorks from "@/components/homepage/HowItWorks";
import ServicesGrid from "@/components/homepage/ServicesGrid";
import WhyVanZ from "@/components/homepage/WhyVanZ";
import LiveJobsFeed from "@/components/homepage/LiveJobsFeed";
import ReviewsSection from "@/components/homepage/ReviewsSection";
import CitiesGrid from "@/components/homepage/CitiesGrid";
import CTABand from "@/components/homepage/CTABand";
import Footer from "@/components/homepage/Footer";

import JsonLd from "@/components/seo/JsonLd";

export default function Home() {
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
      <Navbar />
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
      <Footer />
    </>
  );
}
