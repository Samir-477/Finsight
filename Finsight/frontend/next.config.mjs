/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "8000", pathname: "/charts/**" },
      { protocol: "https", hostname: "**", pathname: "/charts/**" },
      { protocol: "http",  hostname: "**", pathname: "/charts/**" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
