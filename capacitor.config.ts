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
  appName: "몇 번 더",
  webDir: "out",
  android: {
    // 파일을 APK 안에서 읽으므로 http가 아닌 https 스킴으로 띄운다.
    // localStorage가 스킴별로 나뉘므로 이 값을 바꾸면 기존 기록이 안 보인다.
    allowMixedContent: false,
  },
  plugins: {
    /*
     * 앱이 뜨는 첫 순간은 아직 자바스크립트가 돌기 전이라 상태바를 못 고친다.
     * 그 잠깐을 어두운 쪽으로 둔다 — 어두운 앱에 흰 띠가 번쩍이는 것보다,
     * 밝은 앱에 어두운 띠가 잠깐 있는 편이 덜 튄다. 뜨자마자 ThemeApplier가
     * 실제 테마에 맞춰 고친다(lib/nativeStatusBar.ts).
     */
    StatusBar: {
      style: "DARK",
      backgroundColor: "#121317",
    },
  },
};

export default config;
