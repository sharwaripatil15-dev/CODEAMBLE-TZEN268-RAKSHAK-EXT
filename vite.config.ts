import { defineConfig, build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'build-extension-scripts',
      async closeBundle() {
        // Build background.js as a standalone single IIFE file (NO external import statements!)
        await viteBuild({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
              entry: resolve(__dirname, 'src/background/serviceWorker.ts'),
              name: 'background',
              formats: ['iife'],
              fileName: () => 'background.js'
            }
          }
        });

        // Build content.js as a standalone single IIFE file
        await viteBuild({
          configFile: false,
          plugins: [react()],
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
              entry: resolve(__dirname, 'src/content/contentScript.ts'),
              name: 'content',
              formats: ['iife'],
              fileName: () => 'content.js'
            }
          }
        });

        // Build injected.js as a standalone single IIFE file
        await viteBuild({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
              entry: resolve(__dirname, 'src/injected/providerProxy.ts'),
              name: 'injected',
              formats: ['iife'],
              fileName: () => 'injected.js'
            }
          }
        });

        // Copy manifest, popup HTML, and built files to root directory
        fs.copyFileSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'));
        ['background.js', 'content.js', 'injected.js'].forEach((f) => {
          if (fs.existsSync(resolve(__dirname, `dist/${f}`))) {
            fs.copyFileSync(resolve(__dirname, `dist/${f}`), resolve(__dirname, f));
          }
        });
        if (fs.existsSync(resolve(__dirname, 'dist/src/popup/index.html'))) {
          fs.copyFileSync(resolve(__dirname, 'dist/src/popup/index.html'), resolve(__dirname, 'src/popup/index.html'));
        }

        const rootAssets = resolve(__dirname, 'assets');
        const distAssets = resolve(__dirname, 'dist/assets');
        if (!fs.existsSync(rootAssets)) fs.mkdirSync(rootAssets, { recursive: true });
        if (!fs.existsSync(distAssets)) fs.mkdirSync(distAssets, { recursive: true });

        const cyanPngBase64 = 'iVBORw0KGgoAAAANSU56NTAKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOUERdVk4AAAAIAAAAAQAAAAEBAAAAABtFv8AAAAANSURBVBhXY/jPw/A/AAUBAPB/AWoAAAAASUVORK5CYII=';
        const iconBuffer = Buffer.from(cyanPngBase64, 'base64');

        ['icon16.png', 'icon48.png', 'icon128.png'].forEach((iconName) => {
          fs.writeFileSync(resolve(rootAssets, iconName), iconBuffer);
          fs.writeFileSync(resolve(distAssets, iconName), iconBuffer);
        });

        if (fs.existsSync(distAssets)) {
          const files = fs.readdirSync(distAssets);
          files.forEach((file) => {
            fs.copyFileSync(resolve(distAssets, file), resolve(rootAssets, file));
          });
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'src/popup/index.html')
      }
    }
  }
});
