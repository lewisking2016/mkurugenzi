/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Security headers applied to every response.
 *
 * The CSP is deliberately strict but has to allow two things React and Next
 * genuinely need: inline `<style>`/style attributes (framer-motion animates
 * with them) and inline bootstrap scripts (Next's hydration payload). Scripts
 * are additionally locked to our own origin, so an injected <script src> still
 * cannot point at an attacker's server.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' is required by the React dev runtime only.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Stops /mkuruadmin being embedded in an iframe for clickjacking.
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Only meaningful over HTTPS; harmless (and ignored) if a host is still on HTTP.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  // mysql2 must stay a real Node require on the server; bundling it breaks on
  // cPanel shared hosting where native builds are unavailable.
  serverExternalPackages: ['mysql2'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
