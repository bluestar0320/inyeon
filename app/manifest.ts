import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "인연 계산기",
    short_name: "인연",
    description:
      "남은 시간과 남은 만남을 횟수로 계산합니다. 리마인딩이 아니라 플래닝을 위한 계산기.",
    start_url: "/",
    display: "standalone",
    // 설치 직후 첫 화면이 번쩍이지 않도록 페이지 배경과 같은 값을 쓴다.
    background_color: "#fbfaf8",
    theme_color: "#fbfaf8",
    lang: "ko",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
