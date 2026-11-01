import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { publicRoutes, routeMeta, type RouteMeta } from './src/data/routes';

/**
 * One place to declare where the site is hosted. Vercel sets no build-time public URL,
 * so this falls back to the production alias and can be overridden with VITE_SITE_URL
 * once a custom domain exists.
 */
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://nexora-ai-employees.vercel.app').replace(
  /\/+$/,
  '',
);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Rewrites one head tag in place. The template's description tags span several lines, which is why
 * this matches the whole element rather than a line.
 */
function setTag(html: string, attribute: 'name' | 'property' | 'rel', key: string, content: string) {
  const pattern =
    attribute === 'rel'
      ? new RegExp(`<link[^>]*rel="${key}"[^>]*>`, 'i')
      : new RegExp(`<meta[^>]*${attribute}="${key}"[^>]*>`, 'i');
  const tag =
    attribute === 'rel'
      ? `<link rel="${key}" href="${escapeHtml(content)}" />`
      : `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;

  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
}

/**
 * Per-route HTML. The app is a single-page app, so without this every URL serves the same head:
 * a crawler that does not run JavaScript sees "Your AI employees, always working" on the pricing
 * page and a generic card for every employee. Only concrete paths can get this treatment, which is
 * why `routeMeta` lists the eight employees and three guides one by one.
 */
function setHead(html: string, route: RouteMeta) {
  const url = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
  const image = `${siteUrl}${route.image}`;
  const title = `${route.title} · Nexora`;
  const robots = route.private ? 'noindex, nofollow' : 'index, follow';

  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  next = setTag(next, 'name', 'description', route.description);
  next = setTag(next, 'property', 'og:title', title);
  next = setTag(next, 'property', 'og:description', route.description);
  next = setTag(next, 'property', 'og:url', url);
  next = setTag(next, 'property', 'og:image', image);
  next = setTag(next, 'name', 'twitter:title', title);
  next = setTag(next, 'name', 'twitter:description', route.description);
  next = setTag(next, 'name', 'twitter:image', image);
  next = setTag(next, 'name', 'robots', robots);
  next = setTag(next, 'rel', 'canonical', url);
  return next;
}

/** Emits sitemap.xml + robots.txt from the route list, a HTML file per route, and absolutises the
 * meta tags in the shell. */
function siteMeta(): Plugin {
  let outDir = 'dist';

  return {
    name: 'nexora:site-meta',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl);
    },
    async closeBundle() {
      // Runs after Vite has written dist/, so the shell already has absolute URLs.
      const shell = await readFile(path.join(outDir, 'index.html'), 'utf8');

      for (const route of routeMeta) {
        const html = setHead(shell, route);
        // `/` is the shell itself; everything else gets a directory with its own index.html.
        const target =
          route.path === '/'
            ? path.join(outDir, 'index.html')
            : path.join(outDir, route.path.replace(/^\//, ''), 'index.html');

        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html);
      }
    },
    generateBundle() {
      const urls = publicRoutes
        .map((route) => `  <url>\n    <loc>${siteUrl}${route.path === '/' ? '/' : route.path}</loc>\n  </url>`)
        .join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source:
          'User-agent: *\nAllow: /\n' +
          'Disallow: /dashboard\n' +
          'Disallow: /invite\n' +
          'Disallow: /forgot-password\n' +
          'Disallow: /reset-password\n\n' +
          `Sitemap: ${siteUrl}/sitemap.xml\n`,
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
