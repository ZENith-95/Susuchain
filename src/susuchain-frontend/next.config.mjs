/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID: process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID,
    NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID: process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
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
