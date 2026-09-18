import type { Config } from "tailwindcss";

/**
 * 색은 전부 CSS 변수로 받는다. 다크 모드를 컴포넌트마다 dark: 변형으로 적는 대신
 * globals.css에서 팔레트 하나만 갈아 끼우기 위해서다.
 *
 * ink는 명도 사다리라 다크 모드에서 위아래가 뒤집힌다(ink-900은 밝은 쪽에서 가장
 * 어둡고, 어두운 쪽에서 가장 밝다). 그래서 ink 배경 위에 얹는 글자색은 text-white가
 * 아니라 onInk 토큰을 쓴다 — 안 그러면 다크 모드에서 흰 바탕에 흰 글씨가 된다.
 */
const rgb = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: rgb("--ink-50"),
          200: rgb("--ink-200"),
          400: rgb("--ink-400"),
          600: rgb("--ink-600"),
          800: rgb("--ink-800"),
          900: rgb("--ink-900"),
        },
        accent: {
          50: rgb("--accent-50"),
          100: rgb("--accent-100"),
          400: rgb("--accent-400"),
          500: rgb("--accent-500"),
          600: rgb("--accent-600"),
        },
        /** 카드 바탕. 밝은 쪽에서는 흰색, 어두운 쪽에서는 페이지보다 살짝 밝은 회색. */
        surface: rgb("--surface"),
        /** 페이지 바탕. */
        page: rgb("--page"),
        /** ink-800/900 배경 위에 얹는 글자색. */
        onInk: rgb("--on-ink"),
        /** 되돌리기 막대. 양쪽 테마에서 따로 정해 대비를 맞춘다. */
        toast: {
          DEFAULT: rgb("--toast-bg"),
          fg: rgb("--toast-fg"),
          accent: rgb("--toast-accent"),
        },
        danger: {
          border: rgb("--danger-border"),
          bg: rgb("--danger-bg"),
          fg: rgb("--danger-fg"),
        },
      },
    },
  },
  plugins: [],
};

export default config;
