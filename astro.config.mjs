import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Configuration for GitHub Pages deployment
// Replace site and base with your GitHub org/user and repo name if needed
export default defineConfig({
  site: process.env.SITE_URL || 'https://android-ai-skills.github.io',
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
