// 앞으로 남은 만남 보정의 숫자 표. 출처와 상태는 docs/superpowers/specs/2026-11-15-future-modifiers-design.md.
// 상태: 확인 / 미확인 / 앱이 정한 값 / 계산.

import type { Ahead } from "./types";
import type { Rel } from "./rel.ts";

// 확인: KOSIS 생활시간조사 DT_1TS202004, 항목 S711. 대면 교제 시간(분/일, 평균 하루, 남녀 전체), 2024.
// from은 그 연령대가 시작하는 나이: 10대(20 미만) 28, 20대 20, 30대 18, 40대 19, 50대 23, 60세 이상 29.
export const AGE_SOCIAL_MINUTES: readonly { from: number; minutes: number }[] = [
  { from: 0, minutes: 28 },
  { from: 20, minutes: 20 },
  { from: 30, minutes: 18 },
  { from: 40, minutes: 19 },
  { from: 50, minutes: 23 },
  { from: 60, minutes: 29 },
];

// 앱이 정한 값(사용자 결정): 공식 통계 없음. 칩이 켜지면 내년부터 곱한다. 값이 없는 칸은 그 관계에 칩이 없다는 뜻이다.
// 건강 칩의 부모님·조부모님 ×2는 제안 후 승인.
export const AHEAD_FACTOR: Record<Rel, Partial<Record<Ahead, number>>> = {
  friend: { marry: 0.5, child: 0.5, health: 0.5 },
  other: { marry: 0.5, child: 0.5, health: 0.5 },
  sibling: { marry: 0.5, child: 0.5, health: 0.5 },
  child: { marry: 0.5, health: 2 },
  partner: { health: 2 },
  parent: { health: 2 },
  grandparent: { health: 2 },
};

// 앱이 정한 값(사용자 결정 2026-11-27): 내 결혼(결혼 계획의 목표 나이)부터 친구·형제·그 밖의 만남이 반으로. 「앞으로」 결혼 칩과 같은 값.
export const MY_MARRY_FACTOR: Partial<Record<Rel, number>> = { friend: 0.5, other: 0.5, sibling: 0.5 };
