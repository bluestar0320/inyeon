import type { CalcFilter, Frequency, MomentHorizon } from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface FilterPreset {
  label: string;
  hint: string;
  build: () => CalcFilter;
}

/**
 * 필터는 기본값으로 밀어 넣는 게 아니라 사용자가 조건을 직접 세우는 도구다.
 * 프리셋은 "이런 식으로 쓰면 된다"를 보여주는 출발점일 뿐, 값은 전부 수정 가능하다.
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    label: "해마다 줄어듦",
    hint: "지구온난화로 파도가 줄어드는 서핑처럼, 매년 일정 비율씩 기회가 줄어드는 경우",
    build: () => ({
      id: newId(),
      label: "해마다 줄어듦",
      enabled: true,
      kind: "decay",
      ratePerYear: 0.05,
    }),
  },
  {
    label: "해마다 늘어남",
    hint: "은퇴 후처럼 시간이 갈수록 빈도가 늘어나는 경우 (감소율을 음수로 둔 것)",
    build: () => ({
      id: newId(),
      label: "해마다 늘어남",
      enabled: true,
      kind: "decay",
      ratePerYear: -0.05,
    }),
  },
  /*
   * 기후 프리셋.
   *
   * 컨셉이 처음부터 들었던 예("지구온난화로 서핑을 몇 번밖에 못 하게 되는 경우")를
   * 칩으로 만든 것이다. 다만 숫자는 예보가 아니라 **출발점**이다. 기후 모형은
   * 시나리오(얼마나 줄이느냐)에 따라 결과가 크게 갈리고, 지역마다도 다르다.
   * 그래서 고칠 수 있는 값으로 두고, 어떤 가정인지 힌트에 적어 둔다.
   */
  {
    label: "벚꽃이 사라짐",
    hint:
      "온난화가 지금 속도로 이어질 때를 가정한 출발점입니다. 남부부터 개화가 불안정해지는 시점을 대략 30년 뒤로 잡았습니다. 지역과 시나리오에 따라 크게 달라지니 직접 조정하세요.",
    build: () => ({
      id: newId(),
      label: "벚꽃이 사라짐",
      enabled: true,
      kind: "window",
      mode: "only",
      fromYear: 0,
      toYear: 30,
    }),
  },
  {
    label: "눈이 줄어듦",
    hint:
      "겨울이 짧아지며 눈 오는 날이 매년 조금씩 줄어드는 가정. 스키·눈사람처럼 눈이 있어야 하는 일에 겁니다.",
    build: () => ({
      id: newId(),
      label: "눈이 줄어듦",
      enabled: true,
      kind: "decay",
      ratePerYear: 0.03,
    }),
  },
  {
    label: "바다가 달라짐",
    hint:
      "수온과 파도 조건이 나빠져 서핑·해수욕 같은 일이 해마다 줄어드는 가정. 컨셉이 처음 든 예가 이것입니다.",
    build: () => ({
      id: newId(),
      label: "바다가 달라짐",
      enabled: true,
      kind: "decay",
      ratePerYear: 0.04,
    }),
  },
  {
    label: "특정 기간만",
    hint: "몸이 버티는 동안만 가능한 일. 지금부터 몇 년째까지만 센다",
    build: () => ({
      id: newId(),
      label: "특정 기간만",
      enabled: true,
      kind: "window",
      mode: "only",
      fromYear: 0,
      toYear: 20,
    }),
  },
  {
    label: "이 기간은 빼기",
    hint: "유학·파병·장기 프로젝트처럼 한동안 만나지 못하는 구간을 덜어낸다",
    build: () => ({
      id: newId(),
      label: "이 기간은 빼기",
      enabled: true,
      kind: "window",
      mode: "except",
      fromYear: 1,
      toYear: 3,
    }),
  },
  {
    label: "빈도 조정",
    hint: "사정이 생겨 예상보다 덜(또는 더) 하게 될 것 같을 때 전체에 배수를 건다",
    build: () => ({
      id: newId(),
      label: "빈도 조정",
      enabled: true,
      kind: "multiplier",
      factor: 0.8,
    }),
  },
  {
    label: "최대 횟수 제한",
    hint: "무슨 일이 있어도 이 숫자를 넘지 않는다고 볼 때",
    build: () => ({
      id: newId(),
      label: "최대 횟수 제한",
      enabled: true,
      kind: "cap",
      maxTotal: 100,
    }),
  },
];

export interface MomentPreset {
  title: string;
  emoji: string;
  frequency: Frequency;
  horizon: MomentHorizon;
  /** 화면에 띄우는 안내 문구. 사용자의 메모(note)와 다른 것이며 저장되지 않는다. */
  hint?: string;
}

export const MOMENT_PRESETS: MomentPreset[] = [
  { title: "벚꽃 보기", emoji: "🌸", frequency: { count: 1, unit: "year" }, horizon: { kind: "life" } },
  { title: "여름 바다", emoji: "🌊", frequency: { count: 1, unit: "year" }, horizon: { kind: "life" } },
  { title: "해외여행", emoji: "✈️", frequency: { count: 1, unit: "year" }, horizon: { kind: "untilAge", age: 75 } },
  { title: "명절에 본가 가기", emoji: "🏠", frequency: { count: 2, unit: "year" }, horizon: { kind: "life" } },
  { title: "책 한 권 읽기", emoji: "📖", frequency: { count: 1, unit: "month" }, horizon: { kind: "life" } },
  {
    title: "서핑",
    emoji: "🏄",
    frequency: { count: 4, unit: "year" },
    horizon: { kind: "untilAge", age: 70 },
    hint: "파도 조건이 나빠지는 만큼 해마다 줄어듦 필터를 같이 걸어 보세요.",
  },
  { title: "좋아하는 밴드 공연", emoji: "🎸", frequency: { count: 1, unit: "year" }, horizon: { kind: "years", years: 15 } },
  { title: "눈 내리는 날", emoji: "❄️", frequency: { count: 5, unit: "year" }, horizon: { kind: "life" } },
];

export interface RelationPreset {
  relation: string;
  emoji: string;
  frequency: Frequency;
  hoursPerMeeting?: number;
  /** 고르면 성장 캘린더까지 한 번에 켜지는 프리셋(자녀). */
  withGrowth?: boolean;
}

export const RELATION_PRESETS: RelationPreset[] = [
  { relation: "어머니", emoji: "🌷", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 6 },
  { relation: "아버지", emoji: "🌳", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 6 },
  { relation: "조부모", emoji: "🫖", frequency: { count: 2, unit: "year" }, hoursPerMeeting: 8 },
  { relation: "형제·자매", emoji: "🧩", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 5 },
  { relation: "배우자·연인", emoji: "🕊️", frequency: { count: 5, unit: "week" }, hoursPerMeeting: 4 },
  {
    relation: "자녀",
    emoji: "🧸",
    frequency: { count: 6, unit: "week" },
    hoursPerMeeting: 3,
    withGrowth: true,
  },
  { relation: "가까운 친구", emoji: "🍻", frequency: { count: 1, unit: "quarter" }, hoursPerMeeting: 4 },
];

/** 저녁 식사 빈도 칩. 집집마다 다르니 출발점만 준다. */
export const DINNER_PRESETS: { label: string; frequency: Frequency }[] = [
  { label: "매일", frequency: { count: 7, unit: "week" } },
  { label: "주 5회", frequency: { count: 5, unit: "week" } },
  { label: "주 3회", frequency: { count: 3, unit: "week" } },
  { label: "주 1회", frequency: { count: 1, unit: "week" } },
];

/** 결혼 계획에서 "새로운 사람을 얼마나 자주 만나는지" 고르는 칩. */
export const MEETING_FREQUENCY_PRESETS: { label: string; frequency: Frequency }[] = [
  { label: "주 1회", frequency: { count: 1, unit: "week" } },
  { label: "월 2회", frequency: { count: 2, unit: "month" } },
  { label: "월 1회", frequency: { count: 1, unit: "month" } },
  { label: "분기 1회", frequency: { count: 1, unit: "quarter" } },
  { label: "연 1회", frequency: { count: 1, unit: "year" } },
];
