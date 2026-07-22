import type { NextConfig } from "next";

const supabaseHostname = (() => {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!projectUrl) {
    return null;
  }

  try {
    return new URL(projectUrl).hostname;
  } catch {
    return null;
  }
})();

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://wa.me https://api.whatsapp.com"
    ].join('; ')
  }
];

const remoteHostnames = Array.from(new Set([
  'localhost',
  '127.0.0.1',
  '**.supabase.co',
  supabaseHostname,
].filter(Boolean))) as string[];

const nextConfig: NextConfig = {
  trailingSlash: false,
  cleanDistDir: true,
  // CORRECTION VERCEL : désactive la normalisation d'URL par le proxy
  // pour que les routes admin soient correctement routées par Vercel Edge
  skipProxyUrlNormalize: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: remoteHostnames.flatMap((hostname) => ([
      {
        protocol: 'https' as const,
        hostname,
      },
      {
        protocol: 'http' as const,
        hostname,
      },
    ])),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/admin',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
