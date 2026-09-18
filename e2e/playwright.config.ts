import { defineConfig, devices } from "@playwright/test";

/**
 * 계산 엔진은 tests/의 단위 테스트가 지킨다. 여기서는 그 숫자가 실제로 화면까지
 * 흘러나오는지, 그리고 저장·되돌리기·테마처럼 브라우저에서만 드러나는 것들을 본다.
 *
 * webServer로 프로덕션 빌드를 띄운다. 개발 서버에서는 서비스 워커를 등록하지 않으므로
 * 오프라인 테스트가 성립하지 않는다.
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
    command: "npm run build && npm run start -- -p 3123",
    url: "http://localhost:3123",
    cwd: "..",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
