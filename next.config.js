/**
 * 이 앱에는 서버 로직이 전혀 없다. 계산은 브라우저에서 하고 데이터는 localStorage에만
 * 있다. 그래서 정적 파일로 내보내 아무 정적 호스팅에나 올릴 수 있게 한다.
 *
 * BASE_PATH는 하위 경로에 올릴 때 쓴다(GitHub Pages의 /저장소이름 등).
 * 비워 두면 최상위에 올리는 것으로 본다.
 */
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  // 이미지 최적화는 서버가 필요하다. 이 앱은 사진을 쓰지 않으므로 끈다.
  images: { unoptimized: true },
  // 정적 호스팅은 /people 요청에 people/index.html을 주는 쪽이 설정이 덜 필요하다.
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

module.exports = nextConfig;
