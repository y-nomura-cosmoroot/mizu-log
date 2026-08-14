import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev時の左下インジケーターがボトムナビ(nav-home)へのクリックを遮り
  // E2Eが失敗するため無効化する（本番ビルドには影響しない）
  devIndicators: false,
};

export default nextConfig;
