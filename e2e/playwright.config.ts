import { defineConfig, devices } from "@playwright/test";

/**
 * 계산 엔진은 tests/의 단위 테스트가 지킨다. 여기서는 그 숫자가 실제로 화면까지
 * 흘러나오는지, 그리고 저장·되돌리기·테마처럼 브라우저에서만 드러나는 것들을 본다.
 *
 * webServer가 정적 파일을 만들어 띄운다. 실제 배포도 정적 호스팅이므로, 테스트가
 * 배포와 다른 방식으로 뜨면 테스트의 의미가 줄어든다. 개발 서버는 서비스 워커를
 * 등록하지 않아 오프라인 시나리오도 성립하지 않는다.
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3123",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run build && npm run start 3123",
    url: "http://localhost:3123",
    // 설정 파일이 e2e/ 안에 있으므로 저장소 최상위를 가리킨다.
    cwd: "..",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
