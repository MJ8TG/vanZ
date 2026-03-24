import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { seoPagesConfig, getSeoPageConfig } from "@/data/seoPages";
import FaqSection from "@/components/seo/FaqSection";
import JsonLd from "@/components/seo/JsonLd";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";

export async function generateStaticParams() {
  return seoPagesConfig.map((config) => ({
    slug: config.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  const config = getSeoPageConfig(resolvedParams.slug);
  if (!config) return {};
  
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: `seoPages.${config.translationKey}` });
  
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: {
      canonical: `https://vanz.tn/${resolvedParams.locale}/${resolvedParams.slug}`,
      languages: {
        'fr': `https://vanz.tn/fr/${resolvedParams.slug}`,
        'ar': `https://vanz.tn/ar/${resolvedParams.slug}`
      }
    }
  };
}

export default async function SeoPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  const config = getSeoPageConfig(resolvedParams.slug);
  if (!config) notFound();
  
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: `seoPages.${config.translationKey}` });
  const tCta = await getTranslations({ locale: resolvedParams.locale, namespace: "cta" });
  
  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "VanZ",
    "image": "https://vanz.tn/logo-vanz.png",
    "url": "https://vanz.tn",
    "telephone": "+21655000000",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": config.city,
      "addressCountry": "Tunisia"
    },
    "areaServed": {
      "@type": "City",
      "name": config.city
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white dark:bg-vanz-navy">
        <JsonLd data={localBusinessSchema} />
        
        {/* Hero Section */}
        <section className="bg-vanz-navy text-white pt-32 pb-24 px-4 overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
             <div className="absolute top-20 left-10 w-64 h-64 border-[40px] border-white rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-96 h-96 border-[60px] border-vanz-teal rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight font-[family-name:var(--font-cairo)] text-white/95">
              {t("h1")}
            </h1>
            <p className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-vanz-yellow text-vanz-navy font-bold rounded-full hover:brightness-110 transition-all text-lg shadow-[0_0_20px_rgba(245,200,0,0.3)] transform hover:-translate-y-1">
                {tCta("button1")}
              </button>
            </div>
          </div>
        </section>

        {/* SEO Focused Content Block */}
        <section className="py-20 px-4 bg-white dark:bg-[#0f1429]">
          <div className="max-w-4xl mx-auto">
             <div className="grid md:grid-cols-3 gap-8 text-center pb-12 border-b border-gray-100 dark:border-white/5">
                <div className="p-6 rounded-2xl bg-vanz-ice dark:bg-white/5">
                   <div className="w-12 h-12 rounded-full bg-vanz-teal/20 mx-auto flex items-center justify-center mb-4 text-vanz-teal font-bold text-xl">1</div>
                   <h3 className="font-bold text-xl text-vanz-navy dark:text-white mb-2 font-[family-name:var(--font-cairo)]">Rapide</h3>
                   <p className="text-gray-600 dark:text-white/60">Devis instantanés de chauffeurs près de {config.city}</p>
                </div>
                <div className="p-6 rounded-2xl bg-vanz-ice dark:bg-white/5">
                   <div className="w-12 h-12 rounded-full bg-vanz-yellow/20 mx-auto flex items-center justify-center mb-4 text-vanz-yellow-dark font-bold text-xl">2</div>
                   <h3 className="font-bold text-xl text-vanz-navy dark:text-white mb-2 font-[family-name:var(--font-cairo)]">Fiable</h3>
                   <p className="text-gray-600 dark:text-white/60">Transporteurs 100% vérifiés et évalués par la communauté</p>
                </div>
                <div className="p-6 rounded-2xl bg-vanz-ice dark:bg-white/5">
                   <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto flex items-center justify-center mb-4 text-green-500 font-bold text-xl">3</div>
                   <h3 className="font-bold text-xl text-vanz-navy dark:text-white mb-2 font-[family-name:var(--font-cairo)]">Économique</h3>
                   <p className="text-gray-600 dark:text-white/60">Comparez et ne payez pas trop cher pour votre transport</p>
                </div>
             </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-vanz-ice dark:bg-[#080b17]">
          <FaqSection title="Questions Fréquentes" items={faqItems} />
        </section>
      </main>
      <Footer />
    </>
  );
}
