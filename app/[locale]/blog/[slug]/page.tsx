import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { blogArticlesConfig, blogArticlesContent } from "@/data/blogArticles";
import JsonLd from "@/components/seo/JsonLd";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";

export async function generateStaticParams() {
  return blogArticlesConfig.map((config) => ({
    slug: config.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  const config = blogArticlesConfig.find((c) => c.slug === resolvedParams.slug);
  if (!config) return {};
  
  const content = blogArticlesContent[config.slug]?.[resolvedParams.locale as 'fr' | 'ar'];
  if (!content) return {};
  
  return {
    title: `${content.title} | VanZ Blog`,
    description: content.excerpt,
    alternates: {
      canonical: `https://vanz.tn/${resolvedParams.locale}/blog/${resolvedParams.slug}`,
      languages: {
        'fr': `https://vanz.tn/fr/blog/${resolvedParams.slug}`,
        'ar': `https://vanz.tn/ar/blog/${resolvedParams.slug}`
      }
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  const config = blogArticlesConfig.find((c) => c.slug === resolvedParams.slug);
  if (!config) notFound();
  
  const content = blogArticlesContent[config.slug]?.[resolvedParams.locale as 'fr' | 'ar'];
  if (!content) notFound();
  
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: "blog" });
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": content.title,
    "description": content.excerpt,
    "image": "https://vanz.tn/logo-vanz.png",
    "author": {
      "@type": "Organization",
      "name": "VanZ"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VanZ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vanz.tn/logo-vanz.png"
      }
    },
    "datePublished": config.date
  };

  const isRtl = resolvedParams.locale === "ar";
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <main className="flex-1 bg-white dark:bg-vanz-navy min-h-screen pt-32 pb-24">
      <JsonLd data={articleSchema} />
      
      <article className="max-w-3xl mx-auto px-4 w-full">
        <Link 
          href={`/${resolvedParams.locale}/blog`}
          className={`inline-flex items-center gap-2 text-vanz-teal font-bold mb-8 transition-transform hover:${isRtl ? 'translate-x-1' : '-translate-x-1'}`}
        >
          <ArrowIcon size={20} />
          {t("backToBlog")}
        </Link>
        
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-vanz-navy dark:text-white mb-6 leading-tight font-[family-name:var(--font-cairo)]">
            {content.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-white/50 font-medium">
            <span className="flex items-center gap-2">
              <Calendar size={18} />
              {t("publishedOn")} {config.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={18} />
              {config.readTime} min
            </span>
          </div>
        </header>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {content.content.map((block: { type: string; text?: string }, index: number) => {
            if (block.type === 'h2') {
              return (
                <h2 key={index} className="text-3xl font-black text-vanz-navy dark:text-white mt-12 mb-6 font-[family-name:var(--font-cairo)]">
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'p') {
              return (
                <p key={index} className="text-gray-700 dark:text-white/80 leading-relaxed mb-6 text-lg">
                  {block.text}
                </p>
              );
            }
            return null;
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
           <div className="bg-vanz-ice dark:bg-[#0f1429] p-8 md:p-12 rounded-3xl text-center">
              <h3 className="text-2xl md:text-3xl font-black text-vanz-navy dark:text-white mb-4 font-[family-name:var(--font-cairo)]">
                {isRtl ? "هل أنت مستعد لنقل أغراضك؟" : "Prêt à transporter vos biens ?"}
              </h3>
              <p className="text-gray-600 dark:text-white/70 mb-8 text-lg">
                {isRtl 
                  ? "انضم إلى آلاف المستخدمين الذين يثقون في VanZ للقيام بتوصيلاتهم." 
                  : "Rejoignez des milliers d'utilisateurs qui font confiance à VanZ pour leurs livraisons."}
              </p>
              <Link href={`/${resolvedParams.locale}`} className="inline-block px-8 py-4 bg-vanz-yellow text-vanz-navy font-bold rounded-full hover:brightness-110 transition-all hover:scale-105">
                {isRtl ? "انشر إعلاناً مجانياً" : "Publier une annonce gratuite"}
              </Link>
           </div>
        </div>
      </article>
    </main>
  );
}
