"use client";

import DecayHint, { type HintKey } from "@/components/DecayHint";
import NumberInput from "@/components/NumberInput";
import { decayRateFor, perYearAfter } from "@/lib/calc";
import { defineCopy, tr } from "@/lib/i18n";
import { filterPresets } from "@/lib/presets";
import type { CalcFilter } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    unchanged: "빈도 그대로",
    freqDown: (n: number) => `빈도 ${n}% 감소`,
    freqUp: (n: number) => `빈도 ${n}% 증가`,
    decayDown: (n: number) => `매년 ${n}%씩 감소`,
    decayUp: (n: number) => `매년 ${n}%씩 증가`,
    fromToEnd: (from: number) => `${from}년 뒤부터 끝까지`,
    fromTo: (from: number, to: number) => `지금부터 ${from}년 뒤 ~ ${to}년 뒤`,
    except: (range: string) => `${range} 제외`,
    only: (range: string) => `${range}만 포함`,
    cap: (n: number) => `최대 ${n}번`,
    use: (label: string) => `${label} 사용`,
    name: "조건 이름",
    remove: "삭제",
    multBefore: "빈도에",
    multAria: "배수",
    multAfter: "배",
    decayYearsAria: "몇 년 뒤",
    decayYearsAfter: "년 뒤에는 1년에",
    decayTargetAria: "그때 1년에 몇 번",
    decayTargetAfter: "번쯤",
    decayPreview: (now: number, midY: number, mid: number, y: number, end: number) =>
      `올해 ${now}번 · ${midY}년 뒤 ${mid}번 · ${y}년 뒤 ${end}번`,
    decayPlain: (y: number, n: number) => `${y}년 뒤 1년에 ${n}번쯤`,
    decayNoBase: "지금 빈도가 0번이라 달라질 것이 없어요.",
    decayBefore: "매년",
    decayAria: "연간 감소율(%)",
    decayAfter: "%씩 감소 (음수면 증가)",
    windowAria: "구간 포함 여부",
    windowOnly: "이 구간만",
    windowExcept: "이 구간 제외",
    fromAria: "시작(몇 년 뒤)",
    fromAfter: "년 뒤부터",
    toEnd: "끝까지",
    toAria: "끝(몇 년 뒤)",
    toAfter: "년 뒤까지",
    emptyRange: "시작이 끝보다 늦어 이 구간은 비어 있습니다.",
    capBefore: "아무리 많아도",
    capAria: "최대 횟수",
    capAfter: "번까지",
    title: "조건 필터",
    intro: "기본값을 밀어 넣지 않습니다. 이 항목에만 해당하는 조건을 직접 세워 보세요.",
  },
  en: {
    unchanged: "Frequency unchanged",
    freqDown: (n) => `${n}% less often`,
    freqUp: (n) => `${n}% more often`,
    decayDown: (n) => `${n}% less each year`,
    decayUp: (n) => `${n}% more each year`,
    fromToEnd: (from) => `from ${from} years from now on`,
    fromTo: (from, to) => `from ${from} to ${to} years from now`,
    except: (range) => `Skip ${range}`,
    only: (range) => `Only ${range}`,
    cap: (n) => `At most ${n} ${n === 1 ? "time" : "times"}`,
    use: (label) => `Use ${label}`,
    name: "Condition name",
    remove: "Delete",
    multBefore: "Frequency ×",
    multAria: "Multiplier",
    multAfter: "",
    decayYearsAria: "Years from now",
    decayYearsAfter: "years from now, about",
    decayTargetAria: "Times a year by then",
    decayTargetAfter: "times a year",
    decayPreview: (now, midY, mid, y, end) => `This year ${now} · in ${midY} yrs ${mid} · in ${y} yrs ${end}`,
    decayPlain: (y, n) => `About ${n} a year in ${y} years`,
    decayNoBase: "It's 0 times now, so there's nothing to change.",
    decayBefore: "Each year,",
    decayAria: "Yearly decrease (%)",
    decayAfter: "% less (negative means more)",
    windowAria: "Include or skip this range",
    windowOnly: "Only this range",
    windowExcept: "Skip this range",
    fromAria: "Start (years from now)",
    fromAfter: "to",
    toEnd: "end",
    toAria: "End (years from now)",
    toAfter: "years from now",
    emptyRange: "The start is after the end, so this range is empty.",
    capBefore: "No more than",
    capAria: "Maximum count",
    capAfter: "times",
    title: "Conditions",
    intro: "Nothing is added by default. Set up conditions that fit just this one.",
  },
  ja: {
    unchanged: "頻度はそのまま",
    freqDown: (n) => `頻度${n}%減`,
    freqUp: (n) => `頻度${n}%増`,
    decayDown: (n) => `毎年${n}%ずつ減少`,
    decayUp: (n) => `毎年${n}%ずつ増加`,
    fromToEnd: (from) => `今から${from}年後以降ずっと`,
    fromTo: (from, to) => `今から${from}年後〜${to}年後`,
    except: (range) => `${range}を除く`,
    only: (range) => `${range}のみ`,
    cap: (n) => `最大${n}回`,
    use: (label) => `${label}を使う`,
    name: "条件の名前",
    remove: "削除",
    multBefore: "頻度を",
    multAria: "倍率",
    multAfter: "倍",
    decayYearsAria: "何年後",
    decayYearsAfter: "年後には年に",
    decayTargetAria: "そのころ年に何回",
    decayTargetAfter: "回くらい",
    decayPreview: (now, midY, mid, y, end) => `今年${now}回 · ${midY}年後${mid}回 · ${y}年後${end}回`,
    decayPlain: (y, n) => `${y}年後に年${n}回くらい`,
    decayNoBase: "いまの頻度が0回なので、変わるものがありません。",
    decayBefore: "毎年",
    decayAria: "年間の減少率(%)",
    decayAfter: "%ずつ減少(マイナスなら増加)",
    windowAria: "期間を含めるか",
    windowOnly: "この期間のみ",
    windowExcept: "この期間を除く",
    fromAria: "開始（何年後）",
    fromAfter: "年後から",
    toEnd: "最後まで",
    toAria: "終了（何年後）",
    toAfter: "年後まで",
    emptyRange: "開始が終了より後なので、この期間は空です。",
    capBefore: "多くても",
    capAria: "最大回数",
    capAfter: "回まで",
    title: "条件フィルター",
    intro: "初期値は入れていません。これだけに当てはまる条件を自分で決めてみてください。",
  },
  es: {
    unchanged: "Frecuencia igual",
    freqDown: (n) => `${n}% menos a menudo`,
    freqUp: (n) => `${n}% más a menudo`,
    decayDown: (n) => `${n}% menos cada año`,
    decayUp: (n) => `${n}% más cada año`,
    fromToEnd: (from) => `desde dentro de ${from} años en adelante`,
    fromTo: (from, to) => `de ${from} a ${to} años desde hoy`,
    except: (range) => `Excluir ${range}`,
    only: (range) => `Solo ${range}`,
    cap: (n) => `Como máximo ${n} ${n === 1 ? "vez" : "veces"}`,
    use: (label) => `Usar ${label}`,
    name: "Nombre de la condición",
    remove: "Eliminar",
    multBefore: "Frecuencia ×",
    multAria: "Multiplicador",
    multAfter: "",
    decayYearsAria: "Dentro de cuántos años",
    decayYearsAfter: "años, unas",
    decayTargetAria: "Veces al año entonces",
    decayTargetAfter: "veces al año",
    decayPreview: (now, midY, mid, y, end) => `Este año ${now} · en ${midY} años ${mid} · en ${y} años ${end}`,
    decayPlain: (y, n) => `Unas ${n} al año dentro de ${y} años`,
    decayNoBase: "Ahora son 0 veces, así que no hay nada que cambiar.",
    decayBefore: "Cada año,",
    decayAria: "Disminución anual (%)",
    decayAfter: "% menos (negativo = más)",
    windowAria: "Incluir o excluir este periodo",
    windowOnly: "Solo este periodo",
    windowExcept: "Excluir este periodo",
    fromAria: "Inicio (años desde hoy)",
    fromAfter: "a",
    toEnd: "final",
    toAria: "Fin (años desde hoy)",
    toAfter: "años desde hoy",
    emptyRange: "El inicio es posterior al final, así que el periodo está vacío.",
    capBefore: "Como mucho",
    capAria: "Número máximo",
    capAfter: "veces",
    title: "Condiciones",
    intro: "No añadimos nada por defecto. Crea las condiciones que encajen solo con esto.",
  },
  zh: {
    unchanged: "频率不变",
    freqDown: (n) => `频率降低${n}%`,
    freqUp: (n) => `频率提高${n}%`,
    decayDown: (n) => `每年减少${n}%`,
    decayUp: (n) => `每年增加${n}%`,
    fromToEnd: (from) => `从现在起${from}年后到最后`,
    fromTo: (from, to) => `从现在起${from}年后~${to}年后`,
    except: (range) => `排除${range}`,
    only: (range) => `仅限${range}`,
    cap: (n) => `最多${n}次`,
    use: (label) => `启用${label}`,
    name: "条件名称",
    remove: "删除",
    multBefore: "频率乘以",
    multAria: "倍数",
    multAfter: "倍",
    decayYearsAria: "几年后",
    decayYearsAfter: "年后，一年",
    decayTargetAria: "那时一年几次",
    decayTargetAfter: "次左右",
    decayPreview: (now, midY, mid, y, end) => `今年${now}次 · ${midY}年后${mid}次 · ${y}年后${end}次`,
    decayPlain: (y, n) => `${y}年后一年约${n}次`,
    decayNoBase: "现在是0次，没有可变化的。",
    decayBefore: "每年",
    decayAria: "每年减少率(%)",
    decayAfter: "%递减（负数为递增）",
    windowAria: "包含或排除该区间",
    windowOnly: "仅此区间",
    windowExcept: "排除此区间",
    fromAria: "开始（几年后）",
    fromAfter: "年后起",
    toEnd: "到最后",
    toAria: "结束（几年后）",
    toAfter: "年后止",
    emptyRange: "开始晚于结束，该区间为空。",
    capBefore: "最多不超过",
    capAria: "最多次数",
    capAfter: "次",
    title: "条件筛选",
    intro: "不预设任何条件。请为这一项亲自设定合适的条件。",
  },
});

/** "해마다 달라짐"을 몇 년 뒤 기준으로 보여 줄지. 적어 두지 않았으면 20년. */
const DEFAULT_ANCHOR = 20;

/** 1년에 몇 번. 10번 아래는 소수 한 자리까지(1년에 0.5번 = 2년에 한 번). */
function roundCount(n: number): number {
  return n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
}

function describe(filter: CalcFilter, basePerYear?: number): string {
  const t = tr(COPY);
  switch (filter.kind) {
    case "multiplier": {
      const factor = filter.factor ?? 1;
      const delta = Math.round(Math.abs(1 - factor) * 100);
      if (delta === 0) return t.unchanged;
      return factor < 1 ? t.freqDown(delta) : t.freqUp(delta);
    }
    case "decay": {
      if (basePerYear !== undefined && basePerYear > 0) {
        const years = filter.anchorYears ?? DEFAULT_ANCHOR;
        return t.decayPlain(years, roundCount(perYearAfter(basePerYear, filter.ratePerYear ?? 0, years)));
      }
      // 계산은 ±100%에서 막는다(lib/calc.ts). 설명도 같은 값을 말해야 한다.
      const rate = Math.round(Math.min(1, Math.max(-1, filter.ratePerYear ?? 0)) * 1000) / 10;
      return rate >= 0 ? t.decayDown(rate) : t.decayUp(Math.abs(rate));
    }
    case "window": {
      const from = filter.fromYear ?? 0;
      const to = filter.toYear;
      const range = to === undefined ? t.fromToEnd(from) : t.fromTo(from, to);
      return filter.mode === "except" ? t.except(range) : t.only(range);
    }
    case "cap":
      return t.cap(filter.maxTotal ?? 0);
    default:
      return "";
  }
}

function FilterRow({
  filter,
  onChange,
  onRemove,
  basePerYear,
  hint,
}: {
  filter: CalcFilter;
  onChange: (next: CalcFilter) => void;
  onRemove: () => void;
  basePerYear?: number;
  hint: HintKey;
}) {
  const t = tr(COPY);
  return (
    <div className="rounded-xl border border-ink-200/70 bg-ink-50/40 p-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-ink-800"
          checked={filter.enabled}
          onChange={(e) => onChange({ ...filter, enabled: e.target.checked })}
          aria-label={t.use(filter.label)}
        />
        <input
          className="input flex-1 py-1.5"
          value={filter.label}
          placeholder={t.name}
          aria-label={t.name}
          onChange={(e) => onChange({ ...filter, label: e.target.value })}
        />
        <button type="button" className="btn-quiet" onClick={onRemove}>
          {t.remove}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-6 text-sm text-ink-600">
        {filter.kind === "multiplier" && (
          <>
            <span>{t.multBefore}</span>
            <NumberInput
              className="input w-20 py-1"
              min={0}
              max={10}
              step="0.05"
              value={filter.factor ?? 1}
              onChange={(factor) => onChange({ ...filter, factor })}
              aria-label={t.multAria}
            />
            {t.multAfter && <span>{t.multAfter}</span>}
          </>
        )}

        {filter.kind === "decay" && basePerYear !== undefined && (
          <DecayFields filter={filter} onChange={onChange} basePerYear={basePerYear} hint={hint} />
        )}

        {filter.kind === "decay" && basePerYear === undefined && (
          <>
            <span>{t.decayBefore}</span>
            <NumberInput
              className="input w-20 py-1"
              step="0.5"
              min={-50}
              max={100}
              value={Math.round((filter.ratePerYear ?? 0) * 1000) / 10}
              onChange={(percent) => onChange({ ...filter, ratePerYear: percent / 100 })}
              aria-label={t.decayAria}
            />
            <span>{t.decayAfter}</span>
          </>
        )}

        {filter.kind === "window" && (
          <>
            <select
              className="input w-28 py-1"
              value={filter.mode ?? "only"}
              onChange={(e) => onChange({ ...filter, mode: e.target.value as "only" | "except" })}
              aria-label={t.windowAria}
            >
              <option value="only">{t.windowOnly}</option>
              <option value="except">{t.windowExcept}</option>
            </select>
            <NumberInput
              className="input w-20 py-1"
              min={0}
              max={150}
              step="0.5"
              value={filter.fromYear ?? 0}
              onChange={(fromYear) => onChange({ ...filter, fromYear })}
              aria-label={t.fromAria}
            />
            <span>{t.fromAfter}</span>
            <NumberInput
              className="input w-20 py-1"
              min={0}
              max={150}
              step="0.5"
              value={filter.toYear}
              placeholder={t.toEnd}
              onChange={(toYear) => onChange({ ...filter, toYear })}
              onEmpty={() => onChange({ ...filter, toYear: undefined })}
              aria-label={t.toAria}
            />
            <span>{t.toAfter}</span>
            {filter.toYear !== undefined && (filter.fromYear ?? 0) > filter.toYear && (
              <span className="w-full text-[11px] text-ink-600">{t.emptyRange}</span>
            )}
          </>
        )}

        {filter.kind === "cap" && (
          <>
            <span>{t.capBefore}</span>
            <NumberInput
              className="input w-24 py-1"
              min={0}
              max={1_000_000}
              value={filter.maxTotal ?? 0}
              onChange={(maxTotal) => onChange({ ...filter, maxTotal })}
              aria-label={t.capAria}
            />
            <span>{t.capAfter}</span>
          </>
        )}
      </div>

      <p className="mt-2 pl-6 text-[11px] text-ink-400">{describe(filter, basePerYear)}</p>
    </div>
  );
}

/*
 * "해마다 달라짐"을 두 지점으로 적는다: 지금 빈도(이미 적어 둔 값)와 "N년 뒤엔 1년에 몇 번쯤".
 * 사람은 "매년 5% 감소"로 생각하지 않는다. 저장은 여전히 ratePerYear(+ 기준 햇수)다.
 */
function DecayFields({
  filter,
  onChange,
  basePerYear,
  hint,
}: {
  filter: CalcFilter;
  onChange: (next: CalcFilter) => void;
  basePerYear: number;
  hint: HintKey;
}) {
  const t = tr(COPY);
  if (!(basePerYear > 0)) return <span className="text-xs text-ink-600">{t.decayNoBase}</span>;
  const years = filter.anchorYears ?? DEFAULT_ANCHOR;
  const rate = filter.ratePerYear ?? 0;
  const at = (y: number) => perYearAfter(basePerYear, rate, y);
  const mid = Math.max(1, Math.round(years / 2));
  return (
    <>
      <NumberInput
        className="input w-14 px-2 py-1 text-center"
        min={1}
        max={80}
        value={years}
        // 햇수를 바꾸면 그때의 빈도는 그대로 두고 비율을 다시 구한다 — "20년 뒤 4번"을 "30년 뒤 4번"으로.
        onChange={(y) => {
          if (y > 0) onChange({ ...filter, anchorYears: y, ratePerYear: decayRateFor(basePerYear, at(years), y) });
        }}
        aria-label={t.decayYearsAria}
      />
      <span>{t.decayYearsAfter}</span>
      <NumberInput
        className="input w-16 px-2 py-1 text-center"
        min={0}
        max={100000}
        step="0.5"
        value={roundCount(at(years))}
        onChange={(n) => onChange({ ...filter, anchorYears: years, ratePerYear: decayRateFor(basePerYear, n, years) })}
        aria-label={t.decayTargetAria}
      />
      <span>{t.decayTargetAfter}</span>
      <p className="w-full text-xs text-ink-800">
        {t.decayPreview(Math.round(at(0)), mid, Math.round(at(mid)), years, Math.round(at(years)))}
      </p>
      <DecayHint hint={hint} />
    </>
  );
}

export default function FilterEditor({
  filters,
  onChange,
  basePerYear,
  hint = "person",
}: {
  filters: CalcFilter[];
  onChange: (next: CalcFilter[]) => void;
  /** 지금 1년에 몇 번인지. 주면 "해마다 달라짐"을 "N년 뒤 몇 번"으로 적게 한다. */
  basePerYear?: number;
  /** 「헷갈리세요?」에 어떤 통계를 보여 줄지. */
  hint?: HintKey;
}) {
  const t = tr(COPY);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink-800">{t.title}</p>
        <p className="mt-1 text-xs text-ink-400">{t.intro}</p>
      </div>

      {filters.length > 0 && (
        <div className="space-y-2">
          {filters.map((filter) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              onChange={(next) => onChange(filters.map((f) => (f.id === next.id ? next : f)))}
              onRemove={() => onChange(filters.filter((f) => f.id !== filter.id))}
              basePerYear={basePerYear}
              hint={hint}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {filterPresets().map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="chip"
            title={preset.hint}
            onClick={() => onChange([...filters, preset.build()])}
          >
            + {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
