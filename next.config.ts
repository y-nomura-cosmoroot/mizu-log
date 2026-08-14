import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev時の左下インジケーターがボトムナビ(nav-home)へのクリックを遮り
  // E2Eが失敗するため無効化する（本番ビルドには影響しない）
  devIndicators: false,
  // E2Eはユーザのdevサーバー(.next)と衝突しないよう別ディレクトリでビルドする
  // (playwright.config.ts が NEXT_DIST_DIR=.next-e2e を設定して起動する)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
