/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during the production build on Vercel to avoid plugin resolution
    // issues during CI. Consider re-enabling locally or fixing ESLint plugins.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
