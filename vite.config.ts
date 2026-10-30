import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { employees } from './src/data/employees';
import { guides } from './src/data/resources';

/**
 * One place to declare where the site is hosted. Vercel sets no build-time public URL,
 * so this falls back to the production alias and can be overridden with VITE_SITE_URL
 * once a custom domain exists.
 */
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://nexora-ai-employees.vercel.app').replace(
  /\/+$/,
  '',
);

const publicRoutes = [
  '/',
  '/employees',
  ...employees.map((employee) => `/employees/${employee.slug}`),
  '/how-it-works',
  '/pricing',
  '/resources',
  ...guides.map((guide) => `/resources/${guide.slug}`),
  '/login',
  '/signup',
];

/** Emits sitemap.xml + robots.txt from the route list, and absolutises the meta tags. */
function siteMeta(): Plugin {
  return {
    name: 'nexora:site-meta',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl);
    },
    generateBundle() {
      const urls = publicRoutes
        .map((route) => `  <url>\n    <loc>${siteUrl}${route === '/' ? '/' : route}</loc>\n  </url>`)
        .join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /dashboard\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteMeta()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});
