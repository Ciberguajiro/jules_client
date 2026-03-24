import { defineConfig, loadEnv } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [sveltekit(), tailwindcss()],
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
      __JULES_API_URL__: JSON.stringify(env.JULES_API_URL || 'https://jules.googleapis.com'),
      __CSP_ENABLED__: env.CSP_ENABLED === 'true',
      __LOG_LEVEL__: JSON.stringify(env.LOG_LEVEL || 'info'),
      __CACHE_TTL__: parseInt(env.CACHE_TTL || '60'),
      __MAX_CACHE_SIZE__: parseInt(env.MAX_CACHE_SIZE || '50'),
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1422,
      strictPort: true,
      host: host || "127.0.0.1",
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        // 3. tell Vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
    
    // Build optimizations for production
    build: mode === 'production' ? {
      minify: 'terser',
      sourcemap: false,
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['@tauri-apps/api', 'lucide-svelte'],
            ui: ['@/lib/components/ui/button', '@/lib/components/ui/dialog', '@/lib/components/ui/input'],
            utils: ['marked', 'clsx', 'tailwind-merge'],
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
              return `assets/media/[name]-[hash][extname]`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
        // External dependencies that should not be bundled
        external: [],
      },
      // Optimize terser options
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true,
        },
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Optimize assets
      assetsInlineLimit: 4096,
    } : {
      // Development build optimizations
      minify: false,
      sourcemap: true,
    },
  };
});
