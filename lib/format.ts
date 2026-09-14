import type { Frequency, FrequencyUnit } from "./types";

const UNIT_LABEL: Record<FrequencyUnit, string> = {
  day: "하루",
  week: "주",
  month: "한 달",
  quarter: "분기",
  year: "1년",
};

export function formatFrequency(frequency: Frequency): string {
  return `${UNIT_LABEL[frequency.unit]}에 ${formatCount(frequency.count)}번`;
}

export function unitLabel(unit: FrequencyUnit): string {
  return UNIT_LABEL[unit];
}

/**
 * 남은 횟수는 소수점까지 보여줄 이유가 없다. 다만 1보다 작은 값을 0으로 반올림해
 * 버리면 "이미 끝났다"는 잘못된 인상을 주므로 1로 올린다.
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value > 0 && value < 1) return "1";
  return Math.round(value).toLocaleString("ko-KR");
}

export function formatYears(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value < 1) {
    const months = Math.round(value * 12);
    return months <= 0 ? "1개월 미만" : `${months}개월`;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)}년`;
}

export function formatAge(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `만 ${Math.floor(value)}세`;
}

/** 만남 간격을 사람이 읽는 단위로 바꾼다. */
export function formatInterval(days: number | null | undefined): string {
  if (days === null || days === undefined || Number.isNaN(days) || days <= 0) return "-";
  if (days < 1) return `${Math.round(days * 24)}시간마다`;
  if (days < 14) return `${Math.round(days)}일마다`;
  if (days < 60) return `${Math.round(days / 7)}주마다`;
  if (days < 730) return `${Math.round(days / 30.44)}개월마다`;
  return `${(days / 365.2425).toFixed(1)}년마다`;
}

export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined || Number.isNaN(days)) return "-";
  if (days < 1) return `${Math.round(days * 24)}시간`;
  if (days < 365) return `${Math.round(days)}일`;
  return `${(days / 365.2425).toFixed(1)}년`;
}

export function formatPercent(ratio: number | null | undefined, digits = 0): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "-";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
