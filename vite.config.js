import { defineConfig, loadEnv } from 'vite';
import { createLocalGeminiProxy } from './viteGeminiProxy.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: '.',
    plugins: [createLocalGeminiProxy({
      apiKey: env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '',
      groqApiKey: env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || '',
      model: env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'
    })],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'es2020'
    },
    server: {
      port: 5173,
      host: true,
      watch: {
        ignored: ['**/dist/**']
      }
    }
  };
});
