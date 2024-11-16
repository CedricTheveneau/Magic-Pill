import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias['magic-pill'] = path.resolve('node_modules', 'magic-pill');
    }
    return config;
},
output: 'export',
basePath: '/magic-pill-demo',
trailingSlash: true,
};

export default nextConfig;
