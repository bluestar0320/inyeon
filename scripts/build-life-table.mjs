/*
 * lib/lifeTable.ts를 UN World Population Prospects 생명표에서 다시 만든다.
 *
 *   node scripts/build-life-table.mjs <WPP 약식 생명표 .csv.gz 경로>
 *
 * 받는 곳 (인증 없음, 약 144MB):
 *   https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz
 *
 * WPP는 2년마다 개정된다(다음은 2026). 새 판이 나오면 주소의 연도만 바꿔 받아 다시
 * 돌리면 된다. 표에 든 마지막 추정 연도를 자동으로 고른다.
 */
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";

const input = process.argv[2];
if (!input) {
  console.error("사용법: node scripts/build-life-table.mjs <WPP csv.gz>");
  process.exit(1);
}

// lib/lifeExpectancy.ts의 COUNTRIES와 같은 목록이어야 한다.
const CODES = ["KR", "JP", "CN", "TW", "HK", "SG", "US", "CA", "GB", "FR", "DE", "IT", "ES", "NL", "SE", "NO", "DK", "FI", "CH", "AU", "NZ", "RU", "PL", "BR", "MX", "AR", "IN", "ID", "TH", "VN", "PH", "TR", "SA", "AE", "ZA", "NG", "EG"];
const AGES = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
const WORLD_LOC_ID = "900";
const SEX = { Male: "male", Female: "female", Total: "all" };

/** 따옴표를 아는 CSV 한 줄 파서. 지역 이름에 쉼표가 들어 있다("China, Taiwan Province of China"). */
function parse(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), (i += 1);
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") out.push(cur), (cur = "");
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// table[key][year][sex][age] = ex. key는 ISO2 또는 "WORLD".
const table = {};
let col;
const lines = createInterface({ input: createReadStream(input).pipe(createGunzip()) });
for await (const raw of lines) {
  const line = raw.replace(/^﻿/, "");
  if (!col) {
    col = Object.fromEntries(parse(line).map((name, i) => [name, i]));
    continue;
  }
  const row = parse(line);
  const key = row[col.LocID] === WORLD_LOC_ID ? "WORLD" : row[col.ISO2_code];
  if (key !== "WORLD" && !CODES.includes(key)) continue;
  const age = Number(row[col.AgeGrpStart]);
  if (!AGES.includes(age)) continue;
  const sex = SEX[row[col.Sex]];
  const year = Number(row[col.Time]);
  ((((table[key] ??= {})[year] ??= {})[sex] ??= {})[age] = Number(row[col.ex]));
}

const missing = CODES.filter((code) => !table[code]);
if (missing.length > 0 || !table.WORLD) throw new Error(`표에 없는 지역: ${missing.join(", ") || "WORLD"}`);

const year = Math.max(...Object.keys(table.KR).map(Number));
const series = (key, sex) => {
  const values = AGES.map((age) => table[key][year]?.[sex]?.[age]);
  if (values.some((v) => !Number.isFinite(v))) throw new Error(`${key} ${sex} ${year}년 값이 비어 있다`);
  return `[${values.map((v) => Math.round(v * 10) / 10).join(", ")}]`;
};

const body = CODES.map(
  (code) => `  ${code}: { male: ${series(code, "male")}, female: ${series(code, "female")}, all: ${series(code, "all")} },`,
).join("\n");

writeFileSync(
  new URL("../lib/lifeTable.ts", import.meta.url),
  `/*
 * 자동 생성 파일 — 손으로 고치지 마세요. 다시 만들기: scripts/build-life-table.mjs
 * 출처: UN DESA, World Population Prospects 2024, 약식 생명표(Medium), ${year}년 추정치. CC BY 3.0 IGO.
 *
 * 각 배열은 아래 연령 구간의 시작 나이에서의 "앞으로 더 살 것으로 기대되는 햇수"(ex)다.
 * 출생 시 기대수명 하나로 모든 나이를 계산하면 나이가 많을수록 남은 시간을 짧게
 * 잡게 된다(이미 그 나이까지 살아남은 사람은 일찍 떠난 사람들이 끌어내린 평균에
 * 해당하지 않기 때문). 그래서 나이별 표를 그대로 들고 있는다.
 *
 * 대만·홍콩도 같은 출처의 실측 계열이다(WHO GHO에는 없다).
 */

export const LIFE_TABLE_SOURCE = "UN World Population Prospects 2024";
export const LIFE_TABLE_YEAR = ${year};

/** 표의 각 칸이 가리키는 시작 나이. */
export const LIFE_TABLE_AGES = ${JSON.stringify(AGES).replace(/,/g, ", ")};

export interface CountryLifeTable {
  male: number[];
  female: number[];
  all: number[];
}

/** 목록에 없는 국가의 폴백: 세계 전체. */
export const WORLD_LIFE_TABLE: CountryLifeTable = { male: ${series("WORLD", "male")}, female: ${series("WORLD", "female")}, all: ${series("WORLD", "all")} };

export const LIFE_TABLE: Record<string, CountryLifeTable> = {
${body}
};
`,
);
console.log(`lib/lifeTable.ts: ${CODES.length}개국, ${year}년`);
