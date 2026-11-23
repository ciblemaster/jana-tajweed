import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The phone and tablet apps: the same web app inside a native shell (`npm run build && npx cap sync`).
 * Calls to the server go through the native HTTP layer, so the sign-in cookie works without the browser's
 * cross-site rules; the server's address is VITE_API_URL at build time.
 */
const config: CapacitorConfig = {
  appId: 'app.janatajweed',
  appName: 'Jana Tajweed',
  webDir: 'dist',
  backgroundColor: '#fff7e6',
  plugins: {
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true }
  }
};

export default config;
