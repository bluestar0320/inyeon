import type { CapacitorConfig } from "@capacitor/cli";

/**
 * APK로 감싸기 위한 설정.
 *
 * 내보낸 정적 파일(out/)을 APK 안에 통째로 넣는다. 서버를 바라보지 않으므로
 * 설치만 하면 인터넷 없이도 그대로 돈다 — 이 앱은 원래 계산도 저장도 기기에서만 한다.
 *
 * 웹 배포가 본진이고 APK는 곁가지다. 자세한 판단 근거는 docs/PLAN.md의 배포 절 참고.
 */
const config: CapacitorConfig = {
  appId: "app.inyeon.counter",
  appName: "인연 계산기",
  webDir: "out",
  android: {
    // 파일을 APK 안에서 읽으므로 http가 아닌 https 스킴으로 띄운다.
    // localStorage가 스킴별로 나뉘므로 이 값을 바꾸면 기존 기록이 안 보인다.
    allowMixedContent: false,
  },
};

export default config;
