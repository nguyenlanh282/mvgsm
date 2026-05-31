/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mvgsm/shared'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
        maxSize: 200000,
      }
    }
    return config
  },
}

module.exports = nextConfig
