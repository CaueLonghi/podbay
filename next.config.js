/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['mysql2', 'bcryptjs'],
};

module.exports = nextConfig;
