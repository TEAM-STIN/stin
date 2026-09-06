import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // @stin/types는 트랜스파일 전 TS 소스를 export 하므로 Next가 직접 처리하게 한다.
  transpilePackages: ["@stin/types"],
};

export default nextConfig;
