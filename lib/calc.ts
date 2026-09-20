import type {
  AgeSource,
  CalcFilter,
  Frequency,
  FrequencyUnit,
  LifeSpan,
  MarriagePlan,
  Moment,
  MomentHorizon,
  Person,
  PersonHorizon,
  Profile,
} from "./types";

export const DAYS_PER_YEAR = 365.2425;

const PER_YEAR: Record<FrequencyUnit, number> = {
  day: DAYS_PER_YEAR,
  week: DAYS_PER_YEAR / 7,
  month: 12,
  quarter: 4,
  year: 1,
};

/** "주 2회" -> 연간 104.35회. 모든 계산은 연 단위 빈도로 정규화해서 한다. */
export function toPerYear(frequency: Frequency): number {
  const count = Number.isFinite(frequency.count) ? frequency.count : 0;
  return Math.max(0, count) * PER_YEAR[frequency.unit];
}

/** 생년월일로 만 나이를 소수점까지 구한다. 없으면 직접 입력한 나이를 쓴다. */
export function resolveAge(source: AgeSource, now: Date = new Date()): number | null {
  if (source.birthDate) {
    const born = new Date(`${source.birthDate}T00:00:00`);
    if (!Number.isNaN(born.getTime())) {
      const years = (now.getTime() - born.getTime()) / (DAYS_PER_YEAR * 86_400_000);
      return Math.max(0, years);
    }
  }
  if (typeof source.ageYears === "number" && Number.isFinite(source.ageYears)) {
    const base = Math.max(0, source.ageYears);
    if (!source.ageAsOf) return base;
    const asOf = new Date(`${source.ageAsOf}T00:00:00`);
    if (Number.isNaN(asOf.getTime())) return base;
    /*
     * 적어 넣은 날로부터 흐른 만큼 나이를 굴린다.
     *
     * 하루 단위로 끊는 게 중요하다. ageAsOf는 그날 자정인데 실제로 적어 넣은 건
     * 오후일 수 있어서, 시간까지 그대로 쓰면 "30세"가 즉시 30.0014세가 된다.
     * 의미상 틀렸고(적어 넣은 날 하루는 30세여야 한다) 실제로 사고도 났다 —
     * 그 소수점이 결혼 계획 기본 목표 나이의 올림 경계를 넘겨 35세가 40세로,
     * 60번이 120번이 됐다.
     *
     * 음수는 버린다 — 기기 시계가 틀어졌거나 미래 날짜가 들어와도 젊어지면 안 된다.
     */
    const days = Math.floor((now.getTime() - asOf.getTime()) / 86_400_000);
    return base + Math.max(0, days) / DAYS_PER_YEAR;
  }
  return null;
}

/** 예상 수명에서 현재 나이를 뺀 남은 기간(년). 이미 넘겼으면 0. */
/** 지금까지 몇 번 했는지. 시작점을 모르면 세지 않는다. */
export interface PastResult {
  count: number;
  /** 시작점부터 지금까지의 햇수. */
  years: number;
}

/*
 * 지금까지 몇 번.
 *
 * 앞으로를 세는 것과 같은 방식이다 — 흐른 시간 × 빈도. 실제로 몇 번 만났는지
 * 적어 두는 게 아니라 어림하는 것이다. 이 앱은 처음부터 기록장이 아니라 계산기였고,
 * 뒤를 볼 때만 기록장이 되면 앞뒤가 안 맞는다.
 *
 * 조건 필터는 걸지 않는다. 필터는 "앞으로 이렇게 될 것이다"라는 가정이라 이미
 * 지나간 시간에 소급할 근거가 없다(벚꽃이 30년 뒤 사라진다는 가정을 과거에
 * 적용할 수는 없다).
 */
export function computePast(
  frequency: Frequency,
  since: string | undefined,
  now: Date = new Date(),
): PastResult | null {
  if (!since) return null;
  const start = new Date(`${since}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  // 하루 단위로 끊는다. resolveAge와 같은 이유다 — 시작한 날 당일은 0번이어야 한다.
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  if (days < 0) return null;
  const years = days / DAYS_PER_YEAR;
  return { count: Math.max(0, toPerYear(frequency) * years), years };
}

export function remainingYears(span: LifeSpan, now: Date = new Date()): number | null {
  const age = resolveAge(span, now);
  if (age === null) return null;
  if (!Number.isFinite(span.lifeExpectancy)) return null;
  return Math.max(0, span.lifeExpectancy - age);
}

export interface YearSlice {
  /** 지금부터 몇 번째 해인지(0부터). */
  index: number;
  /** 그 해에서 실제로 세는 기간(0~1년). 마지막 해는 1보다 작을 수 있다. */
  span: number;
  /** 필터를 적용하기 전 횟수. */
  baseline: number;
  /** 필터를 적용한 뒤 횟수. */
  adjusted: number;
}

export interface CountResult {
  /** 필터까지 반영한 남은 횟수. */
  total: number;
  /** 필터를 하나도 적용하지 않았을 때의 횟수(비교용). */
  baselineTotal: number;
  /** 실제로 센 기간(년). */
  years: number;
  slices: YearSlice[];
  /** cap 필터에 걸려 잘렸다면 그 상한값. */
  cappedAt: number | null;
}

export interface CountInput {
  years: number;
  perYear: number;
  filters?: CalcFilter[];
  /** 기간 계산의 기준 나이. window 필터를 나이로 쓰고 싶을 때 필요하다. */
  startAge?: number;
}

function overlapFraction(sliceStart: number, sliceSpan: number, from: number, to: number): number {
  if (sliceSpan <= 0) return 0;
  const start = Math.max(sliceStart, from);
  const end = Math.min(sliceStart + sliceSpan, to);
  return Math.max(0, end - start) / sliceSpan;
}

/**
 * 연 단위로 한 해씩 훑으면서 필터를 적용한다.
 * 닫힌 수식 대신 시뮬레이션을 쓰는 이유는 decay(매년 감소)와 window(구간 제한)가
 * 섞이면 수식이 금방 손을 벗어나기 때문이다.
 */
export function countOccurrences(input: CountInput): CountResult {
  const years = Math.max(0, Number.isFinite(input.years) ? input.years : 0);
  const perYear = Math.max(0, Number.isFinite(input.perYear) ? input.perYear : 0);
  const filters = (input.filters ?? []).filter((f) => f.enabled);

  const slices: YearSlice[] = [];
  let total = 0;
  let baselineTotal = 0;

  const sliceCount = Math.ceil(years);
  for (let i = 0; i < sliceCount; i += 1) {
    const span = Math.min(1, years - i);
    if (span <= 0) break;
    const baseline = perYear * span;
    let factor = 1;

    for (const filter of filters) {
      if (filter.kind === "multiplier") {
        factor *= Math.max(0, filter.factor ?? 1);
      } else if (filter.kind === "decay") {
        const rate = filter.ratePerYear ?? 0;
        // 그 해의 한가운데를 기준으로 감쇠시킨다(연초/연말 중 어디를 잡아도
        // 생기는 치우침을 줄이려고).
        const t = i + span / 2;
        factor *= Math.max(0, (1 - rate) ** t);
      } else if (filter.kind === "window") {
        const from = filter.fromYear ?? 0;
        const to = filter.toYear ?? Number.POSITIVE_INFINITY;
        const inside = overlapFraction(i, span, from, to);
        factor *= filter.mode === "except" ? 1 - inside : inside;
      }
    }

    const adjusted = Math.max(0, baseline * factor);
    slices.push({ index: i, span, baseline, adjusted });
    baselineTotal += baseline;
    total += adjusted;
  }

  let cappedAt: number | null = null;
  for (const filter of filters) {
    if (filter.kind !== "cap") continue;
    const max = filter.maxTotal;
    if (typeof max !== "number" || !Number.isFinite(max) || max < 0) continue;
    if (total > max) {
      total = max;
      cappedAt = cappedAt === null ? max : Math.min(cappedAt, max);
    }
  }

  return { total, baselineTotal, years, slices, cappedAt };
}

export type LimitedBy = "me" | "them" | "both" | "horizon" | "unknown";

export interface RelationshipResult extends CountResult {
  /** 나에게 남은 기간(년). */
  myYears: number | null;
  /** 상대에게 남은 기간(년). */
  theirYears: number | null;
  /** 실제로 센 기간 = 두 사람의 남은 시간과 목표 시점 중 가장 먼저 끝나는 것. */
  sharedYears: number;
  limitedBy: LimitedBy;
  /** 목표 시점까지 남은 기간(년). horizon이 life가 아닐 때만. */
  horizonYears: number | null;
  /** 만남 사이의 평균 간격(일). 빈도가 0이면 null. */
  intervalDays: number | null;
  /** 남은 만남을 다 합치면 며칠인지. hoursPerMeeting이 있을 때만. */
  togetherDays: number | null;
}

/** 목표 시점까지 남은 기간. horizon이 life면 상한이 없으므로 null. */
function personHorizonYears(
  horizon: PersonHorizon | undefined,
  profile: Profile | null,
  now: Date,
): number | null {
  if (!horizon || horizon.kind === "life") return null;
  if (horizon.kind === "years") {
    return Number.isFinite(horizon.years) ? Math.max(0, horizon.years) : null;
  }
  const myAge = profile ? resolveAge(profile, now) : null;
  return myAge === null ? null : Math.max(0, horizon.age - myAge);
}

/**
 * 남은 만남 횟수는 "상대의 남은 시간"만으로 정해지지 않는다.
 * 내가 먼저 떠날 수도 있으므로 둘 중 짧은 쪽을 쓰고, 결혼처럼 목표 시점이 따로
 * 있으면 그것까지 포함해 가장 먼저 끝나는 것을 기준으로 삼는다.
 */
export function computeRelationship(
  person: Person,
  profile: Profile | null,
  now: Date = new Date(),
): RelationshipResult {
  const theirYears = remainingYears(person, now);
  const myYears = profile ? remainingYears(profile, now) : null;
  const horizonYears = personHorizonYears(person.horizon, profile, now);

  let sharedYears: number;
  let limitedBy: LimitedBy;
  if (theirYears === null && myYears === null) {
    sharedYears = 0;
    limitedBy = "unknown";
  } else if (theirYears === null) {
    sharedYears = myYears as number;
    limitedBy = "me";
  } else if (myYears === null) {
    sharedYears = theirYears;
    limitedBy = "them";
  } else {
    sharedYears = Math.min(myYears, theirYears);
    const gap = Math.abs(myYears - theirYears);
    limitedBy = gap < 0.5 ? "both" : myYears < theirYears ? "me" : "them";
  }

  // 목표 시점이 수명보다 먼저 오면 그쪽이 기준이 된다.
  if (horizonYears !== null && horizonYears < sharedYears) {
    sharedYears = horizonYears;
    limitedBy = "horizon";
  } else if (horizonYears !== null && limitedBy === "unknown") {
    sharedYears = horizonYears;
    limitedBy = "horizon";
  }

  const perYear = toPerYear(person.frequency);
  const counted = countOccurrences({ years: sharedYears, perYear, filters: person.filters });

  const intervalDays = perYear > 0 ? DAYS_PER_YEAR / perYear : null;
  const hours = person.hoursPerMeeting;
  const togetherDays =
    typeof hours === "number" && Number.isFinite(hours) && hours > 0
      ? (counted.total * hours) / 24
      : null;

  return {
    ...counted,
    myYears,
    theirYears,
    sharedYears,
    limitedBy,
    horizonYears,
    intervalDays,
    togetherDays,
  };
}

export function horizonYears(
  horizon: MomentHorizon,
  profile: Profile | null,
  now: Date = new Date(),
): number | null {
  if (horizon.kind === "years") {
    return Number.isFinite(horizon.years) ? Math.max(0, horizon.years) : null;
  }
  if (horizon.kind === "untilAge") {
    const age = profile ? resolveAge(profile, now) : null;
    if (age === null) return null;
    return Math.max(0, horizon.age - age);
  }
  return profile ? remainingYears(profile, now) : null;
}

export interface MomentResult extends CountResult {
  horizonYears: number | null;
}

export function computeMoment(
  moment: Moment,
  profile: Profile | null,
  now: Date = new Date(),
): MomentResult {
  const span = horizonYears(moment.horizon, profile, now);
  const counted = countOccurrences({
    years: span ?? 0,
    perYear: toPerYear(moment.frequency),
    filters: moment.filters,
  });
  return { ...counted, horizonYears: span };
}

/**
 * 성장 캘린더에 들어가는 항목표. 화면 프리셋이 아니라 계산의 일부라 여기에 둔다
 * (calc.ts는 런타임 import 없이 테스트에서 그대로 불러 쓴다).
 * 저녁 식사만 집마다 달라서 사용자 입력으로 따로 받는다.
 */
const GROWTH_ITEMS: { key: string; label: string; emoji: string; perYear: number }[] = [
  { key: "spring", label: "봄", emoji: "🌱", perYear: 1 },
  { key: "summer", label: "여름", emoji: "🌻", perYear: 1 },
  { key: "autumn", label: "가을", emoji: "🍁", perYear: 1 },
  { key: "winter", label: "겨울", emoji: "⛄", perYear: 1 },
  { key: "summerBreak", label: "여름방학", emoji: "🏖️", perYear: 1 },
  { key: "winterBreak", label: "겨울방학", emoji: "🎿", perYear: 1 },
  { key: "birthday", label: "생일", emoji: "🎂", perYear: 1 },
  { key: "holiday", label: "설·추석", emoji: "🏮", perYear: 2 },
  { key: "weekend", label: "주말", emoji: "🗓️", perYear: 52 },
];

export interface GrowthItem {
  key: string;
  label: string;
  emoji: string;
  count: number;
}

export interface GrowthResult {
  /** 아이가 성인이 될 때까지 남은 기간(년). 나이를 모르면 null. */
  yearsLeft: number | null;
  adultAge: number;
  /** 이미 성인 나이를 넘겼는지. 0번과 "계산 불가"를 구분한다. */
  grownUp: boolean;
  items: GrowthItem[];
}

/**
 * 자녀 성장 캘린더: 아이가 성인이 될 때까지 함께 보낼 계절·방학·저녁 식사 횟수.
 *
 * 사람에게 걸린 조건 필터는 일부러 쓰지 않는다. 그 필터는 "만나는 빈도"를 두고 세운
 * 것이라(예: 매년 5%씩 덜 만남) 계절이나 생일에 곱하면 0.95번 같은 값이 나온다.
 * 캘린더는 아이 나이만으로 정해지는 값이어야 읽는 사람이 숫자를 믿을 수 있다.
 */
export function computeGrowth(
  person: Person,
  now: Date = new Date(),
): GrowthResult | null {
  const setup = person.growth;
  if (!setup) return null;

  const childAge = resolveAge(person, now);
  const yearsLeft = childAge === null ? null : Math.max(0, setup.adultAge - childAge);
  const years = yearsLeft ?? 0;

  const specs = [
    ...GROWTH_ITEMS,
    {
      key: "dinner",
      label: "함께하는 저녁 식사",
      emoji: "🍚",
      perYear: toPerYear(setup.dinners),
    },
  ];

  return {
    yearsLeft,
    adultAge: setup.adultAge,
    grownUp: childAge !== null && childAge >= setup.adultAge,
    items: specs.map((spec) => ({
      key: spec.key,
      label: spec.label,
      emoji: spec.emoji,
      count: countOccurrences({ years, perYear: spec.perYear }).total,
    })),
  };
}

export interface MarriageResult extends CountResult {
  /** 목표 나이까지 남은 기간(년). 프로필이 없으면 null. */
  yearsLeft: number | null;
  /** 목표 나이를 이미 지났는지. 0번과 "계산 불가"를 구분하기 위한 것. */
  targetPassed: boolean;
  /** 기회 사이의 평균 간격(일). 빈도가 0이면 null. */
  intervalDays: number | null;
}

/**
 * 결혼 계획: 목표 결혼 나이까지 새로운 사람을 몇 번 만날 수 있는지.
 * 기간 산출은 "n세까지"인 순간(Moment)과 같은 규칙이라 horizonYears를 그대로 쓴다.
 */
export function computeMarriage(
  plan: MarriagePlan,
  profile: Profile | null,
  now: Date = new Date(),
): MarriageResult {
  const yearsLeft = horizonYears({ kind: "untilAge", age: plan.targetAge }, profile, now);
  const perYear = toPerYear(plan.frequency);
  const counted = countOccurrences({
    years: yearsLeft ?? 0,
    perYear,
    filters: plan.filters,
  });

  const age = profile ? resolveAge(profile, now) : null;
  return {
    ...counted,
    yearsLeft,
    targetPassed: age !== null && age >= plan.targetAge,
    intervalDays: perYear > 0 ? DAYS_PER_YEAR / perYear : null,
  };
}

/** 살아온 비율. 진행 막대와 "인생의 몇 %가 남았나"에 쓴다. */
export function lifeProgress(span: LifeSpan, now: Date = new Date()): number | null {
  const age = resolveAge(span, now);
  if (age === null || !Number.isFinite(span.lifeExpectancy) || span.lifeExpectancy <= 0) return null;
  return Math.min(1, Math.max(0, age / span.lifeExpectancy));
}
