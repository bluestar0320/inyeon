import type { HealthProfile, HealthKey, HealthLevel } from "./types";
import { defineCopy, tr } from "./i18n.ts";

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

type FactorCopy = { label: string; basis: string; options: Record<HealthLevel, string> };

/* 문구는 언어별로, 숫자는 아래 HEALTH_FACTORS 한 곳에만 둔다. */
const COPY = defineCopy<Record<HealthKey, FactorCopy>>({
  ko: {
    smoking: {
      label: "담배",
      basis:
        "평생 흡연자는 비흡연자보다 약 10년을 잃는다는 대규모 연구(Doll 2004, Jha 2013)를 근거로 합니다. 이 앱에서 근거가 가장 확실한 항목입니다.",
      options: { good: "안 피움", mid: "끊었음", bad: "피움" },
    },
    drinking: {
      label: "술",
      basis:
        "많이 마실수록 나쁘다는 방향만 분명하고 연수 환산 근거는 약합니다. 작게 잡은 출발점입니다.",
      options: { good: "거의 안 마심", mid: "가끔", bad: "자주 많이" },
    },
    exercise: {
      label: "운동",
      basis:
        "움직이는 쪽이 낫다는 방향만 분명하고 연수 환산 근거는 약합니다. 작게 잡은 출발점입니다.",
      options: { good: "주 3회 이상", mid: "가끔", bad: "거의 안 함" },
    },
  },
  en: {
    smoking: {
      label: "Smoking",
      basis:
        "Based on large studies (Doll 2004, Jha 2013) showing lifelong smokers lose about 10 years compared with non-smokers. This is the best-supported item in the app.",
      options: { good: "Never", mid: "Quit", bad: "Smoke" },
    },
    drinking: {
      label: "Drinking",
      basis:
        "Only the direction is clear — more is worse — and the evidence for converting it to years is weak. A small starting point.",
      options: { good: "Rarely", mid: "Sometimes", bad: "Often, heavily" },
    },
    exercise: {
      label: "Exercise",
      basis:
        "Only the direction is clear — moving more is better — and the evidence for converting it to years is weak. A small starting point.",
      options: { good: "3+ times a week", mid: "Sometimes", bad: "Rarely" },
    },
  },
  ja: {
    smoking: {
      label: "たばこ",
      basis:
        "生涯喫煙者は非喫煙者より約10年短いという大規模研究（Doll 2004、Jha 2013）に基づきます。このアプリで最も根拠が確かな項目です。",
      options: { good: "吸わない", mid: "やめた", bad: "吸う" },
    },
    drinking: {
      label: "お酒",
      basis:
        "多く飲むほど良くないという方向ははっきりしていますが、年数に換算する根拠は弱めです。小さめに見積もった出発点です。",
      options: { good: "ほとんど飲まない", mid: "ときどき", bad: "よく、たくさん" },
    },
    exercise: {
      label: "運動",
      basis:
        "体を動かすほうが良いという方向ははっきりしていますが、年数に換算する根拠は弱めです。小さめに見積もった出発点です。",
      options: { good: "週3回以上", mid: "ときどき", bad: "ほとんどしない" },
    },
  },
  es: {
    smoking: {
      label: "Tabaco",
      basis:
        "Se basa en grandes estudios (Doll 2004, Jha 2013) según los cuales quien fuma toda la vida pierde unos 10 años frente a quien no fuma. Es el dato mejor respaldado de la app.",
      options: { good: "No fumo", mid: "Lo dejé", bad: "Fumo" },
    },
    drinking: {
      label: "Alcohol",
      basis:
        "Solo está clara la dirección —más es peor— y la base para traducirlo a años es débil. Es un punto de partida prudente.",
      options: { good: "Casi nunca", mid: "A veces", bad: "A menudo y mucho" },
    },
    exercise: {
      label: "Ejercicio",
      basis:
        "Solo está clara la dirección —moverse es mejor— y la base para traducirlo a años es débil. Es un punto de partida prudente.",
      options: { good: "3+ veces por semana", mid: "A veces", bad: "Casi nunca" },
    },
  },
  zh: {
    smoking: {
      label: "吸烟",
      basis:
        "依据大规模研究（Doll 2004、Jha 2013）：终身吸烟者比不吸烟者少活约10年。这是本应用中依据最可靠的一项。",
      options: { good: "不吸", mid: "已戒", bad: "吸烟" },
    },
    drinking: {
      label: "饮酒",
      basis: "只能确定喝得越多越不好，换算成年数的依据较弱。这是保守设定的起点。",
      options: { good: "几乎不喝", mid: "偶尔", bad: "经常大量" },
    },
    exercise: {
      label: "运动",
      basis: "只能确定多动更好，换算成年数的依据较弱。这是保守设定的起点。",
      options: { good: "每周3次以上", mid: "偶尔", bad: "几乎不动" },
    },
  },
});

/* 문구는 읽을 때마다 지금 언어로 가져온다(언어는 렌더 시점에 정해진다). */
function factor(key: HealthKey, offsets: Record<HealthLevel, number>): HealthFactor {
  return {
    key,
    get label() {
      return tr(COPY)[key].label;
    },
    get basis() {
      return tr(COPY)[key].basis;
    },
    options: (["good", "mid", "bad"] as const).map((level) => ({
      level,
      offsetYears: offsets[level],
      get label() {
        return tr(COPY)[key].options[level];
      },
    })),
  };
}

export const HEALTH_FACTORS: HealthFactor[] = [
  factor("smoking", { good: 0, mid: 3, bad: 10 }),
  factor("drinking", { good: 0, mid: 0, bad: 2 }),
  factor("exercise", { good: -2, mid: 0, bad: 2 }),
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
