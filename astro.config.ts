import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';

import type { AstroIntegration } from 'astro';

const getAdapter = (): AstroIntegration => {
  const adapterMapping: { [key: string]: AstroIntegration } = {
    cloudflare: cloudflare(),
    node: node({ mode: 'standalone' }),
  };
  return adapterMapping[process.env.ADAPTER || ''] || adapterMapping.node;
};

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: getAdapter(),
});
