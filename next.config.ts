import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hay un package-lock.json suelto en el home del usuario; sin esto Turbopack
  // infiere mal la raíz del workspace.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
