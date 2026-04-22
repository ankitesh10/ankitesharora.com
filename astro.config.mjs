// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ankitesharora.com',
  build: {
    inlineStylesheets: 'always'
  },
  image: {
    service: passthroughImageService()
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
