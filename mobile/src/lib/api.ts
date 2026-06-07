import Constants from 'expo-constants';

import { datasql } from './supabase';

type ExpoHostConfig = {
  expoConfig?: { hostUri?: string };
  expoGoConfig?: { debuggerHost?: string };
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configured =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_SITE_URL ||
    '';

  if (configured) {
    return stripTrailingSlash(configured);
  }

  const constants = Constants as ExpoHostConfig;
  const hostUri = constants.expoConfig?.hostUri || constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:3000` : '';
};

export async function authApiFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Mobile API URL is not configured. Set EXPO_PUBLIC_API_URL to your web app origin.'
    );
  }

  const {
    data: { session },
  } = await datasql.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to continue.');
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
}
