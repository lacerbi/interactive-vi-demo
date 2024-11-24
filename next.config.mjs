/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enables static HTML export
  basePath: '/interactive-vi-demo', // Should match your repo name
  images: {
    unoptimized: true
  }
};

export default nextConfig;