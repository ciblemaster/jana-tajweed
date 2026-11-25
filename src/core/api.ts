import { Capacitor } from '@capacitor/core';

/**
 * Where the server is: the same site on the web (under the build's base path, e.g. /janatajweed), or VITE_API_URL (e.g. https://api.janatajweed.app) in the phone
 * and tablet apps, which run from the device itself.
 */
export const API_BASE: string = ((import.meta.env.VITE_API_URL as string | undefined) ?? import.meta.env.BASE_URL).replace(
  /\/$/,
  ''
);

export const apiUrl = (path: string) => `${API_BASE}/api${path}`;

/** True inside the iOS or Android app. */
export const isNativeApp = () => Capacitor.isNativePlatform();
