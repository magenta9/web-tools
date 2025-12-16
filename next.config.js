/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/web-tools' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/web-tools/' : '',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig