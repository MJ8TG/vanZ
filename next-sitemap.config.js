/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://vanz.tn',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/api/*', '/_next/*'],
  alternateRefs: [
    {
      href: 'https://vanz.tn/fr',
      hreflang: 'fr',
    },
    {
      href: 'https://vanz.tn/ar',
      hreflang: 'ar',
    },
  ],
  transform: async (config, path) => {
    // Custom transform to ensure /fr and /ar are prioritized
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/fr' || path === '/ar' ? 1.0 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
