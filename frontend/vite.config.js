import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' }), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080', '/ws': { target: 'ws://localhost:8080', ws: true } },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/(@codemirror\/lang-python|@lezer\/python)/.test(id)) return 'editor-python';
          if (/(@codemirror\/lang-cpp|@lezer\/cpp)/.test(id)) return 'editor-cpp';
          if (
            /(@codemirror|@uiw\/|@lezer|\/codemirror\/|\/style-mod\/|\/w3c-keyname\/|\/crelt\/)/.test(
              id,
            )
          )
            return 'editor-core';
          if (/\/(react|react-dom|scheduler)\//.test(id)) return 'ui-vendor';
          if (/(@radix-ui|\/radix-ui\/|@floating-ui|\/sonner\/)/.test(id)) return 'ui-vendor';
        },
      },
    },
  },
});
