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
  /**
   * ageYears를 적어 넣은 날짜(YYYY-MM-DD).
   *
   * 이게 없으면 나이가 영영 안 늙는다. 남은 날을 세는 앱인데 남은 날이 안 줄어드는
   * 셈이라, 저장된 "38"을 그 시점에 묶어 두고 흐른 시간만큼 앞으로 굴린다.
   * 없는 기존 기록은 예전처럼 동작한다(불러올 때 오늘 날짜로 채워 준다).
   */
  ageAsOf?: string;
}

/**
 * 생활 습관. 값은 생명표를 조회할 나이 보정으로 바뀐다(lib/health.ts).
 *
 * LifeSpan에 두지만 지금은 내 프로필에서만 입력받는다. 남의 흡연 여부를 물어
 * 채우게 하는 건 번거롭고 주제넘다. 나중에 인연에도 열고 싶으면 화면만 붙이면 된다.
 */
export type HealthKey = "smoking" | "drinking" | "exercise";
export type HealthLevel = "good" | "mid" | "bad";
export type HealthProfile = Partial<Record<HealthKey, HealthLevel>>;

export interface LifeSpan extends AgeSource {
  /** 없으면 보정 없음. 기능이 생겼다고 기존 기록의 숫자가 달라지면 안 된다. */
  health?: HealthProfile;
  /** 예상 수명(년). 국가 평균에서 자동으로 채우고, 사용자가 덮어쓸 수 있다. */
  lifeExpectancy: number;
  /** true면 사용자가 직접 조정한 값이라 국가/성별을 바꿔도 따라가지 않는다. */
  lifeExpectancyManual: boolean;
  countryCode?: string;
  sex?: Sex;
}

export type Sex = "male" | "female" | "all";

/** 나. 지금은 LifeSpan과 필드가 같지만, 계산에서 맡는 역할이 달라 이름을 따로 둔다. */
export type Profile = LifeSpan;

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
  /**
   * 언제까지 셀지. 없으면 기본값("life") — 둘 중 먼저 끝나는 남은 수명까지.
   * 결혼처럼 목표 시점이 따로 있는 관계는 그 시점까지만 센다.
   */
  horizon?: PersonHorizon;
  /** 자녀에게만 켜는 성장 캘린더. 없으면 캘린더를 보여주지 않는다. */
  growth?: GrowthSetup;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 인연을 언제까지 셀지.
 * - life: 기본. 둘 중 먼저 끝나는 남은 수명까지.
 * - untilMyAge: 내가 그 나이가 될 때까지. "결혼까지 이 사람과 몇 번 데이트할까".
 * - years: 앞으로 n년 동안.
 *
 * life가 아니어도 수명 상한은 그대로 적용된다 — 목표 시점이 아무리 멀어도
 * 둘 중 한 명이 먼저 떠나면 거기서 끝나기 때문이다.
 */
export type PersonHorizon =
  | { kind: "life" }
  | { kind: "untilMyAge"; age: number }
  | { kind: "years"; years: number };

/**
 * 자녀 성장 캘린더 설정.
 *
 * 계절·방학·저녁 식사를 Moment로 미리 만들어 두지 않고 매번 아이 나이에서 계산한다.
 * Moment의 untilAge는 "내" 나이로 풀리기 때문에 "아이가 20세가 될 때까지"를 담을 수
 * 없고, 생성 시점 기준 연수로 굳히면 아이가 자랄수록 캘린더가 조용히 낡는다.
 */
export interface GrowthSetup {
  /** 성인으로 볼 나이. */
  adultAge: number;
  /** 함께하는 저녁 식사 빈도. 집마다 달라서 사용자가 직접 넣는다. */
  dinners: Frequency;
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

/**
 * 결혼 계획. 목표 결혼 나이까지 새로운 사람을 몇 번 만날 수 있는지 센다.
 * 목표 나이는 하나뿐이라 배열이 아니라 단일 값으로 둔다(profile과 같은 취급).
 */
export interface MarriagePlan {
  /** 목표 결혼 나이. */
  targetAge: number;
  /** 새로운 사람을 만나는 빈도(소개팅·모임 등). */
  frequency: Frequency;
  filters: CalcFilter[];
  note?: string;
  updatedAt: string;
}

/** 숫자가 주는 무게감을 고르는 옵션. 문구만 바뀌고 계산은 같다. */
export type Tone = "calm" | "aware";

/** 화면 테마. system이면 기기 설정을 따라간다. */
export type Theme = "system" | "light" | "dark";

export interface Settings {
  tone: Tone;
  theme: Theme;
}

export interface AppState {
  version: 1;
  profile: Profile | null;
  people: Person[];
  moments: Moment[];
  marriage: MarriagePlan | null;
  settings: Settings;
}
