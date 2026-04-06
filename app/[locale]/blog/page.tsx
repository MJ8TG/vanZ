import { getTranslations } from "next-intl/server";
import { blogArticlesConfig, blogArticlesContent } from "@/data/blogArticles";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: "blog" });
  
  return {
    title: t("indexTitle") + " | VanZ",
    description: t("indexSubtitle"),
    alternates: {
      canonical: `https://vanz.tn/${resolvedParams.locale}/blog`,
    }
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: "blog" });
  
  return (
    <main className="flex-1 bg-vanz-ice dark:bg-[#080b17] min-h-screen">
        
        {/* Header */}
        <section className="bg-vanz-navy text-white pt-40 pb-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black mb-6 font-[family-name:var(--font-cairo)]">
              {t("indexTitle")}
            </h1>
            <p className="text-xl text-white/70">
              {t("indexSubtitle")}
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogArticlesConfig.map((article) => {
              const localizedContent = (blogArticlesContent as any)[article.slug]?.[resolvedParams.locale as 'fr' | 'ar'];
              if (!localizedContent) return null;

              return (
                <div key={article.slug} className="group bg-white dark:bg-[#0f1429] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col h-full transform hover:-translate-y-1">
                  
                  {/* Decorative Thumbnail Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-vanz-teal/20 to-vanz-navy/10 dark:from-vanz-teal/10 dark:to-vanz-navy/50 relative overflow-hidden flex items-center justify-center">
                     <span className="text-5xl opacity-20">📦</span>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-white/40 mb-4 font-semibold">
                      <span className="flex items-center gap-1.5"><Calendar size={16} /> {article.date}</span>
                      <span className="flex items-center gap-1.5"><Clock size={16} /> {article.readTime} min</span>
                    </div>

                    <h2 className="text-2xl font-black text-vanz-navy dark:text-white mb-4 line-clamp-2 leading-tight font-[family-name:var(--font-cairo)] group-hover:text-vanz-teal transition-colors">
                      {localizedContent.title}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-white/60 mb-8 line-clamp-3 leading-relaxed flex-1">
                      {localizedContent.excerpt}
                    </p>

                    <Link 
                      href={`/${resolvedParams.locale}/blog/${article.slug}`}
                      className="inline-flex items-center gap-2 font-bold text-vanz-teal group-hover:text-vanz-teal-dark transition-colors self-start"
                    >
                      {t("readArticle")}
                      <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

    </main>
  );
}
