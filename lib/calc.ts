import type {
  AgeSource,
  CalcFilter,
  Frequency,
  FrequencyUnit,
  LifeSpan,
  Moment,
  MomentHorizon,
  Person,
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
    return Math.max(0, source.ageYears);
  }
  return null;
}

/** 예상 수명에서 현재 나이를 뺀 남은 기간(년). 이미 넘겼으면 0. */
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

export type LimitedBy = "me" | "them" | "both" | "unknown";

export interface RelationshipResult extends CountResult {
  /** 나에게 남은 기간(년). */
  myYears: number | null;
  /** 상대에게 남은 기간(년). */
  theirYears: number | null;
  /** 둘 중 먼저 끝나는 쪽 = 실제로 함께할 수 있는 기간. */
  sharedYears: number;
  limitedBy: LimitedBy;
  /** 만남 사이의 평균 간격(일). 빈도가 0이면 null. */
  intervalDays: number | null;
  /** 남은 만남을 다 합치면 며칠인지. hoursPerMeeting이 있을 때만. */
  togetherDays: number | null;
}

/**
 * 남은 만남 횟수는 "상대의 남은 시간"만으로 정해지지 않는다.
 * 내가 먼저 떠날 수도 있으므로 둘 중 짧은 쪽을 쓴다.
 */
export function computeRelationship(
  person: Person,
  profile: Profile | null,
  now: Date = new Date(),
): RelationshipResult {
  const theirYears = remainingYears(person, now);
  const myYears = profile ? remainingYears(profile, now) : null;

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

  const perYear = toPerYear(person.frequency);
  const counted = countOccurrences({ years: sharedYears, perYear, filters: person.filters });

  const intervalDays = perYear > 0 ? DAYS_PER_YEAR / perYear : null;
  const hours = person.hoursPerMeeting;
  const togetherDays =
    typeof hours === "number" && Number.isFinite(hours) && hours > 0
      ? (counted.total * hours) / 24
      : null;

  return { ...counted, myYears, theirYears, sharedYears, limitedBy, intervalDays, togetherDays };
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

/** 살아온 비율. 진행 막대와 "인생의 몇 %가 남았나"에 쓴다. */
export function lifeProgress(span: LifeSpan, now: Date = new Date()): number | null {
  const age = resolveAge(span, now);
  if (age === null || !Number.isFinite(span.lifeExpectancy) || span.lifeExpectancy <= 0) return null;
  return Math.min(1, Math.max(0, age / span.lifeExpectancy));
}
