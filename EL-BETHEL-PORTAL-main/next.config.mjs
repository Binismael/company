/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external preview origins (e.g., Builder.io proxy on fly.dev) to access dev server resources
  allowedDevOrigins: ["*.fly.dev"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
