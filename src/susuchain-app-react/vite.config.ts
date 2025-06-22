import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Function to get canister IDs from .dfx/local/canister_ids.json
function getCanisterIds() {
  try {
    const canisterIdsPath = resolve(__dirname, '../../.dfx/local/canister_ids.json');
    const canisterIds = JSON.parse(readFileSync(canisterIdsPath, 'utf-8'));
    return Object.entries(canisterIds).reduce((acc: Record<string, string>, [key, value]) => {
      const envKey = `process.env.CANISTER_ID_${key.toUpperCase().replace(/-/g, '_')}`;
      acc[envKey] = JSON.stringify((value as any).local);
      return acc;
    }, {} as Record<string, string>);
  } catch (e) {
    console.warn('Could not read canister_ids.json. Ensure dfx deploy has been run.');
    return {};
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  define: {
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK || 'local'),
    ...getCanisterIds(),
    global: {},
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // DFX local replica
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
optimizeDeps: {
    include: ['react', 'react-dom/client'],
  },
});
