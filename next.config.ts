import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    DEV_AUTH_BYPASS: process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === '1' ? '1' : '',
  }
};

export default withNextIntl(nextConfig);
