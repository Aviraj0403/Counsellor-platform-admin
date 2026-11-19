import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Stable libraries get their own long-cached chunks, so an app release only re-downloads app code.
const vendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
  if (/node_modules\/(react-router|react-router-dom)\//.test(id)) return 'vendor-router';
  if (/node_modules\/(lucide-react)\//.test(id)) return 'vendor-icons';
  if (/node_modules\/(axios)\//.test(id)) return 'vendor-net';
  return undefined;
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: process.env.NODE_ENV === 'production' || process.argv.includes('build') ? { drop: ['console', 'debugger'] } : {},
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks: vendorChunk } },
  },
  server: { host: true, port: 5173 },
});
