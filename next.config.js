/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['pg', 'bcryptjs'],
};

module.exports = nextConfig;
