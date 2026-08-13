import { defineConfig } from 'vite';

// Two build entries: the side-panel page and the MV3 service worker.
// The worker must land at a stable path because manifest.json points at it;
// panel assets can hash freely since the HTML references them.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: 'sidepanel.html',
        'service-worker': 'src/background/service-worker.ts',
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'service-worker' ? 'service-worker.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
