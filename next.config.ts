import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.aarong.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lulus.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pinterest.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.app.goo.gl',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ecstasybd.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.yellowclothing.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'store.fcbarcelona.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // Exclude optional, server-side-only modules from the client bundle
    // to prevent errors like "Module not found: Can't resolve 'fs'".
    // This is often needed for the `mongodb` driver.
    config.externals.push(
      'mongodb-client-encryption',
      'gcp-metadata',
      'kerberos',
      'aws4'
    );
    return config;
  },
};

export default nextConfig;
