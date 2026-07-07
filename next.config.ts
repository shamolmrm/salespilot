import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // nodemailer and imapflow use Node.js built-ins — must not be bundled for the browser
  serverExternalPackages: ['nodemailer', 'imapflow', 'pdfkit', 'socket.io', 'pg'],
  env: {
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
    SOCKET_PORT: process.env.SOCKET_PORT ?? '3001',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
