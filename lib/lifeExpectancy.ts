import type { Sex } from "./types";

export interface CountryLifeExpectancy {
  code: string;
  /** 한국어 표기. 셀렉트 박스에 그대로 쓴다. */
  name: string;
  male: number;
  female: number;
  all: number;
}

/**
 * 번들로 들고 다니는 국가별 기대수명(출생 시 기준, 년).
 *
 * 값은 UN World Population Prospects 2024 개정판과 각국 통계청 공표치를 소수 첫째
 * 자리로 반올림한 근사치다. 실시간 통계 API를 붙이기 전까지 쓰는 임시 데이터라서,
 * 화면에서도 "평균값이며 직접 조정할 수 있다"고 밝히고 쓴다.
 * 자세한 배경은 docs/PLAN.md의 "예상 수명 데이터" 절 참고.
 */
export const COUNTRIES: CountryLifeExpectancy[] = [
  { code: "KR", name: "대한민국", male: 80.6, female: 86.4, all: 83.5 },
  { code: "JP", name: "일본", male: 81.1, female: 87.1, all: 84.1 },
  { code: "CN", name: "중국", male: 75.0, female: 80.5, all: 77.6 },
  { code: "TW", name: "대만", male: 76.9, female: 83.7, all: 80.2 },
  { code: "HK", name: "홍콩", male: 82.5, female: 88.2, all: 85.5 },
  { code: "SG", name: "싱가포르", male: 81.1, female: 85.9, all: 83.5 },
  { code: "US", name: "미국", male: 76.3, female: 81.4, all: 78.8 },
  { code: "CA", name: "캐나다", male: 79.8, female: 84.1, all: 81.9 },
  { code: "GB", name: "영국", male: 79.0, female: 82.9, all: 80.9 },
  { code: "FR", name: "프랑스", male: 80.0, female: 85.7, all: 82.9 },
  { code: "DE", name: "독일", male: 78.6, female: 83.4, all: 81.0 },
  { code: "IT", name: "이탈리아", male: 81.1, female: 85.4, all: 83.2 },
  { code: "ES", name: "스페인", male: 80.9, female: 86.2, all: 83.6 },
  { code: "NL", name: "네덜란드", male: 80.5, female: 83.6, all: 82.1 },
  { code: "SE", name: "스웨덴", male: 81.3, female: 84.7, all: 83.0 },
  { code: "NO", name: "노르웨이", male: 81.4, female: 84.6, all: 83.0 },
  { code: "DK", name: "덴마크", male: 79.9, female: 83.4, all: 81.6 },
  { code: "FI", name: "핀란드", male: 79.2, female: 84.2, all: 81.7 },
  { code: "CH", name: "스위스", male: 82.2, female: 85.8, all: 84.0 },
  { code: "AU", name: "호주", male: 81.6, female: 85.4, all: 83.5 },
  { code: "NZ", name: "뉴질랜드", male: 80.6, female: 83.8, all: 82.2 },
  { code: "RU", name: "러시아", male: 68.0, female: 77.8, all: 73.0 },
  { code: "PL", name: "폴란드", male: 74.5, female: 82.0, all: 78.3 },
  { code: "BR", name: "브라질", male: 72.4, female: 79.4, all: 75.9 },
  { code: "MX", name: "멕시코", male: 72.6, female: 78.4, all: 75.5 },
  { code: "AR", name: "아르헨티나", male: 74.0, female: 80.6, all: 77.3 },
  { code: "IN", name: "인도", male: 70.5, female: 73.6, all: 72.0 },
  { code: "ID", name: "인도네시아", male: 69.4, female: 73.6, all: 71.5 },
  { code: "TH", name: "태국", male: 76.0, female: 82.6, all: 79.3 },
  { code: "VN", name: "베트남", male: 71.6, female: 79.9, all: 75.6 },
  { code: "PH", name: "필리핀", male: 68.8, female: 75.6, all: 72.1 },
  { code: "TR", name: "튀르키예", male: 74.0, female: 79.7, all: 76.8 },
  { code: "SA", name: "사우디아라비아", male: 76.2, female: 79.6, all: 77.7 },
  { code: "AE", name: "아랍에미리트", male: 80.8, female: 82.9, all: 81.6 },
  { code: "ZA", name: "남아프리카공화국", male: 62.1, female: 68.5, all: 65.3 },
  { code: "NG", name: "나이지리아", male: 62.5, female: 64.6, all: 63.5 },
  { code: "EG", name: "이집트", male: 69.9, female: 74.5, all: 72.1 },
];

export const DEFAULT_COUNTRY_CODE = "KR";

/** 전 세계 평균(WPP 2024 기준 근사치). 목록에 없는 국가의 폴백. */
const WORLD_AVERAGE = 73.3;

function findCountry(code: string | undefined): CountryLifeExpectancy | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

/** 국가 + 성별로 기대수명을 고른다. 모르면 전 세계 평균으로 떨어진다. */
export function lookupLifeExpectancy(code: string | undefined, sex: Sex | undefined): number {
  const country = findCountry(code);
  if (!country) return WORLD_AVERAGE;
  if (sex === "male") return country.male;
  if (sex === "female") return country.female;
  return country.all;
}
