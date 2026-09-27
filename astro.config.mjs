import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://subrata5.github.io',
  base: process.env.BASE_PATH || '/android-ai-skills',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
    sitemap(),
  ],
});
