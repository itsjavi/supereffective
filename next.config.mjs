import path from 'node:path'

if (!process.env.VERCEL && !process.env.VERCEL_URL) {
  process.env.VERCEL_URL = `localhost:${process.env.PORT || 3000}`
}

if (!process.env.VERCEL && !process.env.NEXTAUTH_URL) {
  const protocol = process.env.VERCEL_URL.includes('localhost') ? 'http://' : 'https://'
  process.env.NEXTAUTH_URL = protocol + process.env.VERCEL_URL
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src', 'styles')],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      // Basic redirect
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/news',
        destination: '/changelog?ref=news',
        permanent: true,
      },
      {
        source: '/livingdex',
        destination: '/apps/livingdex/national',
        permanent: true,
      },
      {
        source: '/apps/livingdex/national',
        destination: 'https://pokepc.net/livingdex',
        permanent: true,
      },
      // Wildcard path matching
      {
        source: '/news/:slug',
        destination: '/changelog?ref=news-:slug',
        permanent: true,
      },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/images/**',
        search: '',
      },
      {
        pathname: '/images/**',
        search: '?dt=20251021.01',
      },
    ],
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: 'classic.pokepc.net',
      },
      { hostname: 'cdn.pokepc.net' },
      { hostname: 'static-img.pokepc.net' },
      { hostname: 'static.pokepc.net' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7 * 4, // 4 weeks
  },
  webpack(config, { webpack }) {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    config.externals.push('@node-rs/argon2', '@node-rs/bcrypt')

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'))

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      },
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
}

export default baseConfig
