import vue from '@vitejs/plugin-vue';
import path from 'path';
import { rm, readdir } from 'fs/promises';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vuetify from 'vite-plugin-vuetify';

const targetedCleanOutDirPl = {
  name: 'clean-public-assets-only',
  async buildStart() {
    const outDir = resolve(__dirname, '../server/static');
    const publicDir = resolve(__dirname, 'public');
    try {
      const publicFiles = await readdir(publicDir);
      for (const file of publicFiles) {
        const targetPath = resolve(outDir, file);
        await rm(targetPath, { recursive: true, force: true });
      }
    } catch (err) {
    }
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    vue(), vuetify({ autoImport: true }),
    command === 'build' && targetedCleanOutDirPl
  ].filter(Boolean),
  appType: 'mpa',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/stellarium-data': 'http://localhost:3000'
    },
    watch: {
      ignored: [
        '**/public/stellarium-data/**'
      ]
    }
  },
  build: {
    outDir: '../server/static',
    emptyOutDir: false,
  },
}));
