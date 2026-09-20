import type { HealthProfile, HealthKey, HealthLevel } from "./types";

/*
 * 생활 습관을 "나이 보정"으로 바꾼다.
 *
 * 왜 연수가 아니라 나이인가.
 * "수명에서 10년을 뺀다"로 구현하면 68세인 사람도 10년을 통째로 잃는다. 그건 틀렸다 —
 * 그 손실의 상당 부분은 이미 살아내서 지나간 것이다. 대신 "이 사람의 사망 위험은
 * n세 더 많은 사람과 비슷하다"로 두고 생명표를 그 나이로 조회하면, 나이에 따른
 * 조정을 표가 알아서 해 준다. 젊을수록 많이 깎이고 고령일수록 덜 깎인다.
 *
 * 숫자의 근거.
 * 흡연만 수명 효과가 제대로 검증돼 있다. 평생 흡연자가 비흡연자보다 약 10년을
 * 잃는다는 건 여러 대규모 코호트에서 반복 확인됐다(Doll 2004 영국 의사 연구,
 * Jha 2013 NEJM). 끊은 경우는 언제 끊었는지에 따라 크게 갈리는데(이르게 끊을수록
 * 거의 되돌아온다) 그걸 묻지 않으므로 중간값을 둔다.
 *
 * 음주와 운동은 방향만 확실하고 연수 환산 근거는 약하다. 그래서 값을 작게 두고,
 * 화면에서 어느 항목이 몇 년을 보탰는지 전부 드러낸다. 숨기지 않으면 사용자가
 * 판단할 수 있고, 예상 수명 칸에서 직접 덮어쓸 수도 있다.
 *
 * 체중(BMI)은 뺐다. 키·몸무게 두 칸을 더 받아야 하는데 얻는 건 ±1~3년이고,
 * 자가판정("나는 과체중인가")은 부정확하다. 입력 비용이 값어치를 넘는다.
 */

export interface HealthOption {
  level: HealthLevel;
  label: string;
  /** 생명표를 조회할 때 나이에 더할 햇수. 음수면 또래보다 젊게 본다. */
  offsetYears: number;
}

export interface HealthFactor {
  key: HealthKey;
  label: string;
  options: HealthOption[];
  /** 이 항목의 숫자가 어디서 왔는지. 화면에 그대로 띄운다. */
  basis: string;
}

export const HEALTH_FACTORS: HealthFactor[] = [
  {
    key: "smoking",
    label: "담배",
    basis:
      "평생 흡연자는 비흡연자보다 약 10년을 잃는다는 대규모 연구(Doll 2004, Jha 2013)를 근거로 합니다. 이 앱에서 근거가 가장 확실한 항목입니다.",
    options: [
      { level: "good", label: "안 피움", offsetYears: 0 },
      { level: "mid", label: "끊었음", offsetYears: 3 },
      { level: "bad", label: "피움", offsetYears: 10 },
    ],
  },
  {
    key: "drinking",
    label: "술",
    basis:
      "많이 마실수록 나쁘다는 방향만 분명하고 연수 환산 근거는 약합니다. 작게 잡은 출발점입니다.",
    options: [
      { level: "good", label: "거의 안 마심", offsetYears: 0 },
      { level: "mid", label: "가끔", offsetYears: 0 },
      { level: "bad", label: "자주 많이", offsetYears: 2 },
    ],
  },
  {
    key: "exercise",
    label: "운동",
    basis:
      "움직이는 쪽이 낫다는 방향만 분명하고 연수 환산 근거는 약합니다. 작게 잡은 출발점입니다.",
    options: [
      { level: "good", label: "주 3회 이상", offsetYears: -2 },
      { level: "mid", label: "가끔", offsetYears: 0 },
      { level: "bad", label: "거의 안 함", offsetYears: 2 },
    ],
  },
];

/** 항목별로 몇 년이 붙었는지. 총합만 보여주면 어디서 왔는지 알 수 없다. */
export interface HealthBreakdownRow {
  key: HealthKey;
  label: string;
  optionLabel: string;
  offsetYears: number;
}

export function healthBreakdown(health: HealthProfile | undefined): HealthBreakdownRow[] {
  if (!health) return [];
  const rows: HealthBreakdownRow[] = [];
  for (const factor of HEALTH_FACTORS) {
    const level = health[factor.key];
    if (level === undefined) continue;
    const option = factor.options.find((o) => o.level === level);
    // 저장된 값이 표에 없으면(옛 기록 등) 없는 셈 친다. 0으로 우겨 넣지 않는다.
    if (!option || option.offsetYears === 0) continue;
    rows.push({
      key: factor.key,
      label: factor.label,
      optionLabel: option.label,
      offsetYears: option.offsetYears,
    });
  }
  return rows;
}

/**
 * 생명표 조회에 쓸 나이 보정치.
 *
 * 아무것도 고르지 않았으면 0이다 — 이 기능이 생겼다고 기존 사용자의 숫자가
 * 조용히 달라지면 안 된다.
 *
 * 합계에 상한(-4 ~ +14)을 둔다. 항목이 늘어날 때 전부 나쁜 쪽을 골라 보정이
 * 무한정 커지면, 근거가 약한 항목들이 근거가 확실한 흡연을 압도하게 된다.
 */
export function healthAgeOffset(health: HealthProfile | undefined): number {
  const sum = healthBreakdown(health).reduce((acc, row) => acc + row.offsetYears, 0);
  return Math.max(-4, Math.min(14, sum));
}
