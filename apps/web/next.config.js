const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      root: path.join(__dirname),
    },
  },
};

module.exports = nextConfig;
