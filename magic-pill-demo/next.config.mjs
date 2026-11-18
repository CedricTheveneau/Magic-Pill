import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Magic-Pill',
  trailingSlash: true,
  // The library's package-lock.json one level up would otherwise make Next
  // guess the repo root as the workspace root
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
};

export default nextConfig;
