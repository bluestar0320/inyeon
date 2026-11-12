"use client";

import { useId, useState } from "react";

import NumberInput from "@/components/NumberInput";
import { defineCopy, tr } from "@/lib/i18n";
import { ACADEMY_DEFAULT } from "@/lib/pastRules";
import type { Bond, BondDetail } from "@/lib/types";

/*
 * 인연 편집 화면의 관계 칩과 그 세부 칸. 칩을 하나만 골라도 「지금까지 적어도 N번」이 나오고,
 * 세부 칸은 모두 선택이다. 고른 칩과 관련 있는 칸만 보인다.
 */
const COPY = defineCopy({
  ko: {
    title: "어떤 사이인가요? 여러 개 골라도 됩니다",
    names: ["초등학교 친구", "중학교 친구", "고등학교 친구", "대학교 동기", "학원 친구", "직장 동료", "부모님", "조부모님", "형제자매", "그 밖에"],
    preview: (n: string) => `지금까지 적어도 ${n}번 만났어요`,
    school: { elementary: "초등학교", middle: "중학교", high: "고등학교" },
    attended: (name: string) => `${name}, 같이 다닌 기간`,
    all: "전부",
    years: (n: number) => `${n}년`,
    never: "같이 안 다님",
    academyYears: "학원, 같이 다닌 기간(년)",
    academyPerWeek: "학원에서 일주일에 몇 번 봤나요",
    military: "군 복무",
    militaryOptions: ["해당 없음", "미필", "군필"],
    meEnlist: "내가 입대한 해",
    themEnlist: "상대가 입대한 해",
    livedUntil: "몇 살까지 같이 살았나요",
    livesNow: "지금도 같이 살아요",
    workEnd: "그만둔 해 (다니는 중이면 비워 두세요)",
    shift: "입학한 해",
    shiftOptions: ["한 해 일찍 (빠른 년생)", "보통", "한 해 늦게"],
  },
  en: {
    title: "How do you know them? Pick as many as fit",
    names: ["Elementary school friend", "Middle school friend", "High school friend", "University classmate", "Cram school friend", "Coworker", "Parent", "Grandparent", "Sibling", "Other"],
    preview: (n) => `You've met at least ${n} times so far`,
    school: { elementary: "Elementary school", middle: "Middle school", high: "High school" },
    attended: (name) => `${name}, time together`,
    all: "All of it",
    years: (n) => `${n} yr`,
    never: "Not together",
    academyYears: "Cram school, years together",
    academyPerWeek: "Times a week you saw each other there",
    military: "Military service",
    militaryOptions: ["Doesn't apply", "Not served", "Served"],
    meEnlist: "Year I enlisted",
    themEnlist: "Year they enlisted",
    livedUntil: "Until what age did you live together?",
    livesNow: "We still live together",
    workEnd: "Year they left (leave empty if still there)",
    shift: "School entry year",
    shiftOptions: ["A year early", "Usual", "A year late"],
  },
  ja: {
    title: "どんな間柄ですか？ いくつ選んでもかまいません",
    names: ["小学校の友だち", "中学校の友だち", "高校の友だち", "大学の同期", "塾の友だち", "職場の同僚", "両親", "祖父母", "きょうだい", "その他"],
    preview: (n) => `これまでに少なくとも${n}回会っています`,
    school: { elementary: "小学校", middle: "中学校", high: "高校" },
    attended: (name) => `${name}、一緒に通った期間`,
    all: "全部",
    years: (n) => `${n}年`,
    never: "一緒に通っていない",
    academyYears: "塾、一緒に通った期間（年）",
    academyPerWeek: "塾で週に何回会いましたか",
    military: "兵役",
    militaryOptions: ["該当なし", "未了", "済み"],
    meEnlist: "自分が入隊した年",
    themEnlist: "相手が入隊した年",
    livedUntil: "何歳まで一緒に住んでいましたか",
    livesNow: "いまも一緒に住んでいます",
    workEnd: "辞めた年（在籍中なら空欄）",
    shift: "入学した年",
    shiftOptions: ["1年早く", "ふつう", "1年遅く"],
  },
  es: {
    title: "¿Qué relación tienen? Puedes elegir varias",
    names: ["Amistad de primaria", "Amistad de secundaria", "Amistad de bachillerato", "Compañero de universidad", "Amistad de la academia", "Compañero de trabajo", "Padres", "Abuelos", "Hermanos", "Otro"],
    preview: (n) => `Se han visto al menos ${n} veces hasta ahora`,
    school: { elementary: "Primaria", middle: "Secundaria", high: "Bachillerato" },
    attended: (name) => `${name}, tiempo juntos`,
    all: "Todo",
    years: (n) => `${n} años`,
    never: "No coincidieron",
    academyYears: "Academia, años juntos",
    academyPerWeek: "Veces por semana que se veían allí",
    military: "Servicio militar",
    militaryOptions: ["No aplica", "No hecho", "Hecho"],
    meEnlist: "Año en que entré",
    themEnlist: "Año en que entró la otra persona",
    livedUntil: "¿Hasta qué edad vivieron juntos?",
    livesNow: "Seguimos viviendo juntos",
    workEnd: "Año en que se fue (vacío si sigue)",
    shift: "Año de entrada al colegio",
    shiftOptions: ["Un año antes", "Normal", "Un año después"],
  },
  zh: {
    title: "你们是什么关系？可以多选",
    names: ["小学朋友", "初中朋友", "高中朋友", "大学同学", "补习班朋友", "同事", "父母", "祖父母", "兄弟姐妹", "其他"],
    preview: (n) => `到现在至少见过${n}次`,
    school: { elementary: "小学", middle: "初中", high: "高中" },
    attended: (name) => `${name}，一起上学的时间`,
    all: "全程",
    years: (n) => `${n}年`,
    never: "没有一起上",
    academyYears: "补习班，一起上的年数",
    academyPerWeek: "在补习班每周见几次",
    military: "兵役",
    militaryOptions: ["不适用", "未服", "已服"],
    meEnlist: "我入伍的年份",
    themEnlist: "对方入伍的年份",
    livedUntil: "一起住到几岁",
    livesNow: "现在还住在一起",
    workEnd: "离职的年份（还在职就留空）",
    shift: "入学的年份",
    shiftOptions: ["早一年", "正常", "晚一年"],
  },
});

const ORDER: (Bond | "other")[] = ["elementary", "middle", "high", "university", "academy", "coworker", "parent", "grandparent", "sibling", "other"];
const STAGE_MAX = { elementary: 6, middle: 3, high: 3 } as const;
const STAGES = ["elementary", "middle", "high"] as const;
const THIS_YEAR = new Date().getFullYear();
const CHIP = "chip min-h-11";

export function withBond(bonds: Bond[] | undefined, bond: Bond): Bond[] {
  return bonds?.includes(bond) ? bonds : [...(bonds ?? []), bond];
}

export function BondPreview({ count }: { count: string }) {
  return <p data-testid="past-preview" className="px-1 text-sm font-medium text-ink-800">{tr(COPY).preview(count)}</p>;
}

/** 「그 밖에」는 bonds를 비우는 칩이라 따로 눌린 상태(other)를 들고 있는다. */
export function BondChips({
  bonds,
  other,
  onChange,
}: {
  bonds: Bond[] | undefined;
  other: boolean;
  onChange: (bonds: Bond[] | undefined, other: boolean) => void;
}) {
  const t = tr(COPY);
  const id = useId();
  return (
    <div role="group" aria-labelledby={`${id}-t`}>
      <p id={`${id}-t`} className="label">{t.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((key, i) => {
          const pressed = key === "other" ? other : Boolean(bonds?.includes(key));
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              className={pressed ? `${CHIP} chip-active` : CHIP}
              onClick={() => {
                if (key === "other") return onChange(undefined, !other);
                const next = pressed ? (bonds ?? []).filter((b) => b !== key) : [...(bonds ?? []), key];
                onChange(next.length ? next : undefined, false);
              }}
            >
              {t.names[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BondDetailFields({
  bonds,
  detail,
  onChange,
}: {
  bonds: Bond[];
  detail: BondDetail | undefined;
  onChange: (detail: BondDetail | undefined) => void;
}) {
  const t = tr(COPY);
  const ids = useId();
  const d = detail ?? {};
  const has = (b: Bond) => bonds.includes(b);
  const stages = STAGES.filter(has);
  const schoolish = stages.length > 0 || has("university");
  const family = has("parent") || has("sibling") || has("grandparent");
  const [mil, setMil] = useState(d.military ? 2 : 0);

  function set(patch: Partial<BondDetail>): void {
    const next: BondDetail = { ...d, ...patch };
    for (const k of Object.keys(next) as (keyof BondDetail)[]) if (next[k] === undefined) delete next[k];
    onChange(Object.keys(next).length ? next : undefined);
  }
  function setEnlist(who: "me" | "them", year: number | undefined): void {
    const m = { ...d.military, [who]: year };
    if (m.me === undefined) delete m.me;
    if (m.them === undefined) delete m.them;
    set({ military: m.me === undefined && m.them === undefined ? undefined : m });
  }

  return (
    <>
      {stages.map((stage) => {
        const v = d.schoolYears?.[stage];
        const name = t.school[stage];
        return (
          <div key={stage}>
            <label className="label" htmlFor={`${ids}-${stage}`}>{t.attended(name)}</label>
            <select
              id={`${ids}-${stage}`}
              className="input w-full sm:w-56"
              value={v === undefined ? "all" : String(v)}
              onChange={(e) => {
                const { [stage]: _drop, ...rest } = d.schoolYears ?? {};
                const next = e.target.value === "all" ? rest : { ...rest, [stage]: Number(e.target.value) };
                set({ schoolYears: Object.keys(next).length ? next : undefined });
              }}
            >
              <option value="all">{t.all}</option>
              {Array.from({ length: STAGE_MAX[stage] - 1 }, (_, k) => STAGE_MAX[stage] - 1 - k).map((n) => (
                <option key={n} value={n}>{t.years(n)}</option>
              ))}
              <option value="0">{t.never}</option>
            </select>
          </div>
        );
      })}

      {has("academy") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor={`${ids}-ay`}>{t.academyYears}</label>
            <NumberInput
              id={`${ids}-ay`}
              className="input"
              min={0.5}
              max={20}
              step="0.5"
              value={d.academy?.years ?? ACADEMY_DEFAULT.years}
              onChange={(years) => set({ academy: { perWeek: ACADEMY_DEFAULT.perWeek, ...d.academy, years } })}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${ids}-aw`}>{t.academyPerWeek}</label>
            <NumberInput
              id={`${ids}-aw`}
              className="input"
              min={1}
              max={7}
              value={d.academy?.perWeek ?? ACADEMY_DEFAULT.perWeek}
              onChange={(perWeek) => set({ academy: { years: ACADEMY_DEFAULT.years, ...d.academy, perWeek } })}
            />
          </div>
        </div>
      )}

      {schoolish && (
        <div>
          <label className="label" htmlFor={`${ids}-shift`}>{t.shift}</label>
          <select
            id={`${ids}-shift`}
            className="input w-full sm:w-56"
            value={String(d.schoolShift ?? 0)}
            onChange={(e) => set({ schoolShift: e.target.value === "0" ? undefined : (Number(e.target.value) as -1 | 1) })}
          >
            {([-1, 0, 1] as const).map((s, i) => (
              <option key={s} value={s}>{t.shiftOptions[i]}</option>
            ))}
          </select>
        </div>
      )}

      {family && (
        <div className="space-y-2">
          {!d.livesTogether && (
            <div>
              <label className="label" htmlFor={`${ids}-until`}>{t.livedUntil}</label>
              <NumberInput
                id={`${ids}-until`}
                className="input w-28"
                min={0}
                max={120}
                value={d.livedUntilAge}
                onChange={(livedUntilAge) => set({ livedUntilAge })}
                onEmpty={() => set({ livedUntilAge: undefined })}
              />
            </div>
          )}
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              className="size-5"
              checked={Boolean(d.livesTogether)}
              onChange={(e) => set({ livesTogether: e.target.checked || undefined })}
            />
            {t.livesNow}
          </label>
        </div>
      )}

      {has("coworker") && (
        <div>
          <label className="label" htmlFor={`${ids}-end`}>{t.workEnd}</label>
          <NumberInput
            id={`${ids}-end`}
            className="input w-28"
            min={1950}
            max={THIS_YEAR}
            value={d.workEndYear}
            onChange={(workEndYear) => set({ workEndYear })}
            onEmpty={() => set({ workEndYear: undefined })}
          />
        </div>
      )}

      {(schoolish || has("coworker")) && (
        <div role="group" aria-labelledby={`${ids}-mil`}>
          <p id={`${ids}-mil`} className="label">{t.military}</p>
          <div className="flex flex-wrap gap-1.5">
            {t.militaryOptions.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={mil === i}
                className={mil === i ? `${CHIP} chip-active` : CHIP}
                onClick={() => {
                  setMil(i);
                  // 해당 없음과 미필은 둘 다 복무 없음이다. 군필만 입대한 해를 적는다.
                  if (i !== 2) set({ military: undefined });
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {mil === 2 && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["me", "them"] as const).map((who) => (
                <div key={who}>
                  <label className="label" htmlFor={`${ids}-${who}`}>{who === "me" ? t.meEnlist : t.themEnlist}</label>
                  <NumberInput
                    id={`${ids}-${who}`}
                    className="input"
                    min={1950}
                    max={THIS_YEAR}
                    value={d.military?.[who]}
                    onChange={(y) => setEnlist(who, y)}
                    onEmpty={() => setEnlist(who, undefined)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
