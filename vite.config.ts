import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        postcss: './postcss.config.js',
      },
      build: {
        minify: 'esbuild',
        esbuild: {
          drop: isProduction ? ['console', 'debugger'] : [],
        },
      },
      server: {
        // Security headers removed for development
        // headers: {
        //   'X-Content-Type-Options': 'nosniff',
        //   'X-Frame-Options': 'SAMEORIGIN',
        //   'X-XSS-Protection': '1; mode=block',
        //   'Referrer-Policy': 'strict-origin-when-cross-origin',
        //   'Cross-Origin-Opener-Policy': 'unsafe-none'
        // }
      }
    };
});
