/*
 * 배경 종이. 구겨지고 바랜 편지지 사진 10장 중 한 장을 페이지마다 무작위로 깐다.
 * 사진은 public/paper/paper-1..10.webp — 평균 색을 앱의 종이색(--page)에 맞춰 두었다(글자 대비 유지).
 *
 * "use client"를 붙이지 않는다. layout.tsx의 그리기 전 스크립트(서버 컴포넌트)도 읽는다.
 */
export const PAPER_COUNT = 10;

/** 지난번과 다른 한 장을 고른다. 같은 종이가 연달아 나오면 바뀐 줄 모른다. */
export function pickPaper(previous: number | null, random: () => number = Math.random): number {
  if (PAPER_COUNT < 2) return 1;
  let n = 1 + Math.floor(random() * PAPER_COUNT);
  if (n === previous) n = (n % PAPER_COUNT) + 1;
  return n;
}

export function paperUrl(n: number): string {
  return `url("${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/paper/paper-${n}.webp")`;
}
