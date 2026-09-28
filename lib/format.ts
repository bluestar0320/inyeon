import { defineCopy, locale, tr } from "./i18n.ts";
import type { Frequency, FrequencyUnit } from "./types";

const COPY = defineCopy({
  ko: {
    unit: { day: "하루", week: "주", month: "한 달", quarter: "분기", year: "1년" } as Record<FrequencyUnit, string>,
    frequency: (unit: string, count: string) => `${unit}에 ${count}번`,
    lessThanMonth: "1개월 미만",
    months: (n: number) => `${n}개월`,
    years: (n: string) => `${n}년`,
    age: (n: number) => `만 ${n}세`,
    everyMinutes: (n: number) => `${n}분마다`,
    everyHours: (n: number) => `${n}시간마다`,
    everyDays: (n: number) => `${n}일마다`,
    everyWeeks: (n: number) => `${n}주마다`,
    everyMonths: (n: number) => `${n}개월마다`,
    everyYears: (n: string) => `${n}년마다`,
    hours: (n: number) => `${n}시간`,
    days: (n: number) => `${n}일`,
  },
  en: {
    unit: { day: "a day", week: "a week", month: "a month", quarter: "a quarter", year: "a year" },
    frequency: (unit, count) => `${count} ${count === "1" ? "time" : "times"} ${unit}`,
    lessThanMonth: "under a month",
    months: (n) => `${n} ${n === 1 ? "month" : "months"}`,
    years: (n) => `${n} ${n === "1" || n === "1.0" ? "year" : "years"}`,
    age: (n) => `age ${n}`,
    everyMinutes: (n) => `every ${n} ${n === 1 ? "minute" : "minutes"}`,
    everyHours: (n) => `every ${n} ${n === 1 ? "hour" : "hours"}`,
    everyDays: (n) => (n === 1 ? "every day" : `every ${n} days`),
    everyWeeks: (n) => (n === 1 ? "every week" : `every ${n} weeks`),
    everyMonths: (n) => (n === 1 ? "every month" : `every ${n} months`),
    everyYears: (n) => (n === "1" ? "every year" : `every ${n} years`),
    hours: (n) => `${n} ${n === 1 ? "hour" : "hours"}`,
    days: (n) => `${n} ${n === 1 ? "day" : "days"}`,
  },
  ja: {
    unit: { day: "1日", week: "週", month: "月", quarter: "四半期", year: "年" },
    frequency: (unit, count) => `${unit}に${count}回`,
    lessThanMonth: "1か月未満",
    months: (n) => `${n}か月`,
    years: (n) => `${n}年`,
    age: (n) => `${n}歳`,
    everyMinutes: (n) => `${n}分ごと`,
    everyHours: (n) => `${n}時間ごと`,
    everyDays: (n) => `${n}日ごと`,
    everyWeeks: (n) => `${n}週間ごと`,
    everyMonths: (n) => `${n}か月ごと`,
    everyYears: (n) => `${n}年ごと`,
    hours: (n) => `${n}時間`,
    days: (n) => `${n}日`,
  },
  es: {
    unit: { day: "al día", week: "a la semana", month: "al mes", quarter: "al trimestre", year: "al año" },
    frequency: (unit, count) => `${count} ${count === "1" ? "vez" : "veces"} ${unit}`,
    lessThanMonth: "menos de un mes",
    months: (n) => `${n} ${n === 1 ? "mes" : "meses"}`,
    years: (n) => `${n} ${n === "1" || n === "1.0" ? "año" : "años"}`,
    age: (n) => `${n} años`,
    everyMinutes: (n) => `cada ${n} ${n === 1 ? "minuto" : "minutos"}`,
    everyHours: (n) => `cada ${n} ${n === 1 ? "hora" : "horas"}`,
    everyDays: (n) => (n === 1 ? "cada día" : `cada ${n} días`),
    everyWeeks: (n) => (n === 1 ? "cada semana" : `cada ${n} semanas`),
    everyMonths: (n) => (n === 1 ? "cada mes" : `cada ${n} meses`),
    everyYears: (n) => (n === "1" ? "cada año" : `cada ${n} años`),
    hours: (n) => `${n} ${n === 1 ? "hora" : "horas"}`,
    days: (n) => `${n} ${n === 1 ? "día" : "días"}`,
  },
  zh: {
    unit: { day: "每天", week: "每周", month: "每月", quarter: "每季度", year: "每年" },
    frequency: (unit, count) => `${unit}${count}次`,
    lessThanMonth: "不到1个月",
    months: (n) => `${n}个月`,
    years: (n) => `${n}年`,
    age: (n) => `${n}岁`,
    everyMinutes: (n) => `每${n}分钟`,
    everyHours: (n) => `每${n}小时`,
    everyDays: (n) => `每${n}天`,
    everyWeeks: (n) => `每${n}周`,
    everyMonths: (n) => `每${n}个月`,
    everyYears: (n) => `每${n}年`,
    hours: (n) => `${n}小时`,
    days: (n) => `${n}天`,
  },
});

export function formatFrequency(frequency: Frequency): string {
  const t = tr(COPY);
  return t.frequency(t.unit[frequency.unit], formatCount(frequency.count));
}

export function unitLabel(unit: FrequencyUnit): string {
  return tr(COPY).unit[unit];
}

/**
 * 남은 횟수는 소수점까지 보여줄 이유가 없다. 다만 1보다 작은 값을 0으로 반올림해
 * 버리면 "이미 끝났다"는 잘못된 인상을 주므로 1로 올린다.
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value > 0 && value < 1) return "1";
  return Math.round(value).toLocaleString(locale());
}

export function formatYears(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const t = tr(COPY);
  // 0은 0이다. "1개월 미만"이라고 하면 아직 조금 남은 것처럼 읽힌다(목표가 이미 지난 경우).
  if (value <= 0) return t.years("0");
  if (value < 1) {
    const months = Math.round(value * 12);
    return months <= 0 ? t.lessThanMonth : t.months(months);
  }
  return t.years(value.toFixed(value < 10 ? 1 : 0));
}

export function formatAge(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return tr(COPY).age(Math.floor(value));
}

/** 만남 간격을 사람이 읽는 단위로 바꾼다. */
export function formatInterval(days: number | null | undefined): string {
  if (days === null || days === undefined || Number.isNaN(days) || days <= 0) return "-";
  const t = tr(COPY);
  // 반올림한 값이 0이 되면 한 단계 작은 단위로(하루 1000번이 "0시간마다"로 나왔다),
  // 12개월이 되면 한 단계 큰 단위로(연 1회가 "12개월마다"로 나왔다) 옮긴다.
  if (days * 24 < 1) return t.everyMinutes(Math.max(1, Math.round(days * 1440)));
  if (days < 1) return t.everyHours(Math.round(days * 24));
  if (days < 14) return t.everyDays(Math.round(days));
  if (days < 60) return t.everyWeeks(Math.round(days / 7));
  const months = Math.round(days / 30.44);
  if (months < 12) return t.everyMonths(months);
  const years = days / 365.2425;
  return t.everyYears(Number.isInteger(Math.round(years * 10) / 10) ? String(Math.round(years)) : years.toFixed(1));
}

export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined || Number.isNaN(days)) return "-";
  const t = tr(COPY);
  if (days < 1) return t.hours(Math.round(days * 24));
  if (days < 365) return t.days(Math.round(days));
  return t.years((days / 365.2425).toFixed(1));
}

export function formatPercent(ratio: number | null | undefined, digits = 0): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "-";
  return `${(ratio * 100).toFixed(digits)}%`;
}

/**
 * 받침에 맞춰 조사를 붙인다. josa("어머니", "와/과") → "어머니와".
 *
 * 한글이 아닌 이름은 한국어로 읽는 소리로 짐작한다.
 * - 숫자: 한국어로 읽는다(1 일 → 받침, 2 이 → 없음).
 * - 영문: -l, -m, -n, -ng, -ck로 끝나면 받침이 생긴다(Tom 톰, Bill 빌, Jack 잭, King 킹).
 *   나머지는 "으"가 붙거나 모음으로 끝나 받침이 없다(Kate 케이트, Chris 크리스, Peter 피터).
 * - 한자·가나 등 읽는 법을 알 수 없는 글자만 "와(과)"로 둘 다 적는다.
 */
const JOSA = {
  // [받침 없을 때, 받침 있을 때]
  "와/과": ["와", "과"],
  "을/를": ["를", "을"],
  "은/는": ["는", "은"],
  "이/가": ["가", "이"],
} as const;

/** 받침이 있으면 true, 없으면 false, 알 수 없으면 null. */
function hasFinal(word: string): boolean | null {
  const trimmed = word.trim();
  const last = trimmed.slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code >= 0 && code <= 11171) return code % 28 !== 0;
  if (/[0-9]/.test(last)) return "013678".includes(last);
  if (/[a-z]/i.test(last)) return /(l|m|n|ng|ck)$/i.test(trimmed);
  return null;
}

export function josa(word: string, pair: keyof typeof JOSA): string {
  const [noFinal, withFinal] = JOSA[pair];
  const final = hasFinal(word);
  if (final === null) return `${word}${pair.replace("/", "(")})`;
  return word + (final ? withFinal : noFinal);
}

/** 기기 시간대 기준 오늘(YYYY-MM-DD). toISOString은 UTC라 한국 오전 9시 전에는 어제가 된다. */
export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
