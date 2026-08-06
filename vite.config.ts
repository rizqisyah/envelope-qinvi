import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /*
   * Dev proxy: the browser calls same-origin `/api/...` and Vite forwards it to the real
   * backend. The target used to be localhost:3000 -- a backend that does not run on this
   * machine, so every request came back 502. Set VITE_API_PROXY_TARGET to override.
   */
  const target = env.VITE_API_PROXY_TARGET || 'https://api.qinvi.id'
  const isProd = mode === 'production'

  return {
    plugins: [vue()],
    // Production build serves static files under /TemaEnvelop/ asset subpath on VPS
    base: isProd ? '/TemaEnvelop/' : '/',
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
