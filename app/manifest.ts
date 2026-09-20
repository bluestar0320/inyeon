import type { MetadataRoute } from "next";

/** 정적 내보내기에서는 매니페스트도 빌드 시점에 한 번 만들어 파일로 떨어뜨린다. */
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "몇 번 더",
    short_name: "몇번더",
    description:
      "남은 시간과 남은 만남을 횟수로 계산합니다. 리마인딩이 아니라 플래닝을 위한 계산기.",
    start_url: `${base}/`,
    display: "standalone",
    // 설치 직후 첫 화면이 번쩍이지 않도록 페이지 배경과 같은 값을 쓴다.
    background_color: "#fbfaf8",
    theme_color: "#fbfaf8",
    lang: "ko",
    orientation: "portrait",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icon-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
