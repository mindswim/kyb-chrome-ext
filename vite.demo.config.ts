import { defineConfig } from 'vite';

// The zero-install demo build: the fake-browser harness plus the real panel
// it embeds. Kept separate from vite.config.ts so `npm run build` stays a
// pure extension build — the harness never ships in the unpacked extension.
export default defineConfig({
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        harness: 'harness.html',
        sidepanel: 'sidepanel.html',
      },
    },
  },
});
