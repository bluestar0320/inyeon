/** 빈도를 표현하는 단위. "주 2회"는 { count: 2, unit: "week" }. */
export type FrequencyUnit = "day" | "week" | "month" | "quarter" | "year";

export interface Frequency {
  count: number;
  unit: FrequencyUnit;
}

/**
 * 사용자가 직접 만드는 조건. 기본 설정값이 아니라 "이 사람/이 행동에만 해당하는
 * 외부 변수"를 얹는 용도다. (예: 지구온난화로 서핑 가능 횟수가 매년 줄어든다)
 */
export type FilterKind = "multiplier" | "decay" | "window" | "cap";

export interface CalcFilter {
  id: string;
  label: string;
  enabled: boolean;
  kind: FilterKind;
  /** multiplier: 빈도에 곱할 배수. 0.7이면 30% 감소, 1.2면 20% 증가. */
  factor?: number;
  /** decay: 매년 줄어드는 비율(0.05 = 매년 5%씩 감소). 음수면 매년 증가. */
  ratePerYear?: number;
  /** window: 지금으로부터 n년 뒤부터 / n년 뒤까지. mode로 포함/제외를 고른다. */
  fromYear?: number;
  toYear?: number;
  mode?: "only" | "except";
  /** cap: 필터를 다 적용한 뒤 씌우는 절대 상한. */
  maxTotal?: number;
}

/** 나이는 생년월일이 있으면 그것으로, 없으면 직접 입력한 값으로 정한다. */
export interface AgeSource {
  birthDate?: string;
  ageYears?: number;
}

export interface LifeSpan extends AgeSource {
  /** 예상 수명(년). 국가 평균에서 자동으로 채우고, 사용자가 덮어쓸 수 있다. */
  lifeExpectancy: number;
  /** true면 사용자가 직접 조정한 값이라 국가/성별을 바꿔도 따라가지 않는다. */
  lifeExpectancyManual: boolean;
  countryCode?: string;
  sex?: Sex;
}

export type Sex = "male" | "female" | "all";

export interface Profile extends LifeSpan {
  displayName?: string;
}

export interface Person extends LifeSpan {
  id: string;
  name: string;
  /** "어머니", "대학 친구" 같은 자유 입력 라벨. */
  relation?: string;
  emoji?: string;
  frequency: Frequency;
  /** 한 번 만날 때 함께 보내는 시간(시간 단위). 총 체류 시간 환산에 쓴다. */
  hoursPerMeeting?: number;
  filters: CalcFilter[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 사람이 아니라 행동/순간을 세는 모듈. "앞으로 벚꽃을 몇 번 볼까" 같은 것. */
export type MomentHorizon =
  | { kind: "life" }
  | { kind: "untilAge"; age: number }
  | { kind: "years"; years: number };

export interface Moment {
  id: string;
  title: string;
  emoji?: string;
  frequency: Frequency;
  horizon: MomentHorizon;
  filters: CalcFilter[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 숫자가 주는 무게감을 고르는 옵션. 문구만 바뀌고 계산은 같다. */
export type Tone = "calm" | "aware";

export interface Settings {
  tone: Tone;
  /** 대시보드에서 남은 횟수 대신 남은 비율을 먼저 보여줄지. */
  showShareFirst: boolean;
}

export interface AppState {
  version: 1;
  profile: Profile | null;
  people: Person[];
  moments: Moment[];
  settings: Settings;
}
