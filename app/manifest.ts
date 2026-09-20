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
    /*
     * 상태바와 시작 화면 색. 어두운 쪽으로 고정한다.
     *
     * 안드로이드에 설치된 PWA(WebAPK)는 상태바 색을 **매니페스트에서만** 가져온다.
     * 실행 중에 <meta name="theme-color">를 바꿔도 무시한다. 그래서 앱 안의 테마
     * 설정(시스템/밝게/어둡게)을 따라가게 만들 방법이 없고, 하나를 골라야 한다.
     *
     * 양쪽이 비대칭이라 어두운 쪽을 고른다.
     *   어두운 앱 + 흰 상태바   → 위쪽만 흰 띠로 남아 고장 난 것처럼 보인다
     *   밝은 앱 + 어두운 상태바 → 제목 표시줄처럼 보여 어색하지 않다
     *
     * 이 값은 설치 시점에 굳는다. 이미 설치한 사람은 크롬이 제 주기에 매니페스트를
     * 다시 읽을 때까지(하루 이상 걸릴 수 있다) 옛 색을 쓰고, 지웠다 다시 설치하면
     * 바로 바뀐다.
     *
     * 브라우저 탭에서는 <meta name="theme-color">가 살아 있어서 테마를 따라간다
     * (lib/themeColor.ts). 그쪽은 이 값과 무관하다.
     */
    background_color: "#121317",
    theme_color: "#121317",
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
