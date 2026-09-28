"use client";

import { useId } from "react";

import FrequencyInput from "@/components/FrequencyInput";
import ShareButton from "@/components/ShareButton";
import type { GrowthResult } from "@/lib/calc";
import { formatCount, formatYears, josa } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { dinnerPresets } from "@/lib/presets";
import type { Frequency, GrowthSetup } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    title: "성장 캘린더",
    grownUp: (name: string, age: number) => `${josa(name, "은/는")} 이미 만 ${age}세를 넘었습니다.`,
    until: (name: string, age: number) =>
      `${josa(name, "이/가")} 만 ${age}세가 될 때까지 함께 보낼 수 있는 것들.`,
    off: "끄기",
    ageMissing: "나이나 생년월일을 채우면 계산됩니다.",
    grownUpHint: "성인 나이를 더 뒤로 잡거나, 이 사람에게는 캘린더를 꺼 두세요.",
    timeLeftBefore: "함께할 시간이 ",
    timeLeftAfter: " 남았습니다.",
    timesUnit: "번",
    times: (n: string) => `${n}번`,
    left: (label: string) => `남은 ${label}`,
    leftFile: (label: string) => `남은${label}`,
    caption: (age: number, years: string) => `만 ${age}세까지 ${years}`,
    adultAge: "성인으로 보는 나이",
    ageUnit: "세",
    ageChip: (age: number) => `${age}세`,
    dinners: "함께하는 저녁 식사",
    note:
      "이 숫자들은 아이 나이만으로 정해집니다. 위의 조건 필터는 만남 횟수에만 적용되고 캘린더에는 쓰지 않습니다 — 계절이나 생일에 배수를 곱하면 0.95번 같은 값이 나오기 때문입니다.",
  },
  en: {
    title: "Growing-up calendar",
    grownUp: (name, age) => `${name} is already past ${age}.`,
    until: (name, age) => `What you can still share until ${name} turns ${age}.`,
    off: "Turn off",
    ageMissing: "Add an age or birthday to see the count.",
    grownUpHint: "Set a later adult age, or turn the calendar off for this person.",
    timeLeftBefore: "You have ",
    timeLeftAfter: " together.",
    timesUnit: "times",
    times: (n) => `${n} times`,
    left: (label) => `${label} left`,
    leftFile: (label) => `${label} left`,
    caption: (age, years) => `${years} until age ${age}`,
    adultAge: "Age of adulthood",
    ageUnit: "yrs",
    ageChip: (age) => `${age}`,
    dinners: "Dinners together",
    note:
      "These numbers depend only on the child's age. The conditions above apply to meetings only, not to the calendar — multiplying seasons or birthdays would give values like 0.95 times.",
  },
  ja: {
    title: "成長カレンダー",
    grownUp: (name, age) => `${name}はもう${age}歳を過ぎています。`,
    until: (name, age) => `${name}が${age}歳になるまでに一緒に過ごせるもの。`,
    off: "オフ",
    ageMissing: "年齢か誕生日を入れると計算します。",
    grownUpHint: "大人とみなす年齢を上げるか、この人のカレンダーはオフにしてください。",
    timeLeftBefore: "一緒に過ごせる時間は、あと",
    timeLeftAfter: "です。",
    timesUnit: "回",
    times: (n) => `${n}回`,
    left: (label) => `残りの${label}`,
    leftFile: (label) => `残りの${label}`,
    caption: (age, years) => `${age}歳まで${years}`,
    adultAge: "大人とみなす年齢",
    ageUnit: "歳",
    ageChip: (age) => `${age}歳`,
    dinners: "一緒に食べる夕食",
    note:
      "これらの数字は子どもの年齢だけで決まります。上の条件フィルターは会う回数にだけ使い、カレンダーには使いません — 季節や誕生日に倍率をかけると0.95回のような値になるためです。",
  },
  es: {
    title: "Calendario de crecimiento",
    grownUp: (name, age) => `${name} ya ha pasado de los ${age}.`,
    until: (name, age) => `Lo que aún podéis compartir hasta que ${name} cumpla ${age}.`,
    off: "Desactivar",
    ageMissing: "Añade la edad o la fecha de nacimiento para calcularlo.",
    grownUpHint: "Sube la edad adulta o desactiva el calendario para esta persona.",
    timeLeftBefore: "Os quedan ",
    timeLeftAfter: " juntos.",
    timesUnit: "veces",
    times: (n) => `${n} veces`,
    left: (label) => `${label} por delante`,
    leftFile: (label) => `${label} por delante`,
    caption: (age, years) => `${years} hasta los ${age}`,
    adultAge: "Edad adulta",
    ageUnit: "años",
    ageChip: (age) => `${age} años`,
    dinners: "Cenas juntos",
    note:
      "Estos números dependen solo de la edad del niño. Las condiciones de arriba solo se aplican a los encuentros, no al calendario: multiplicar estaciones o cumpleaños daría valores como 0,95 veces.",
  },
  zh: {
    title: "成长日历",
    grownUp: (name, age) => `${name}已经过了${age}岁。`,
    until: (name, age) => `到${name}${age}岁之前，还能一起度过的这些。`,
    off: "关闭",
    ageMissing: "填写年龄或生日后即可计算。",
    grownUpHint: "把成年年龄调大一些，或者为这个人关闭日历。",
    timeLeftBefore: "还能一起度过",
    timeLeftAfter: "。",
    timesUnit: "次",
    times: (n) => `${n}次`,
    left: (label) => `剩下的${label}`,
    leftFile: (label) => `剩下的${label}`,
    caption: (age, years) => `到${age}岁还有${years}`,
    adultAge: "视为成年的年龄",
    ageUnit: "岁",
    ageChip: (age) => `${age}岁`,
    dinners: "一起吃的晚饭",
    note:
      "这些数字只由孩子的年龄决定。上面的条件筛选只用于见面次数，不用于日历——因为给季节或生日乘上倍数，会得出0.95次这样的值。",
  },
});

const ADULT_AGES = [18, 19, 20];

function sameFrequency(a: Frequency, b: Frequency): boolean {
  return a.unit === b.unit && a.count === b.count;
}

export default function GrowthCalendar({
  name,
  setup,
  result,
  onChange,
  onDisable,
}: {
  name: string;
  setup: GrowthSetup;
  result: GrowthResult;
  onChange: (next: GrowthSetup) => void;
  onDisable: () => void;
}) {
  const t = tr(COPY);
  const ids = useId();
  const summer = result.items.find((item) => item.key === "summer");

  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.title}</p>
          <p className="mt-1 text-xs text-ink-400">
            {result.grownUp
              ? t.grownUp(name, setup.adultAge)
              : t.until(name, setup.adultAge)}
          </p>
        </div>
        <button type="button" className="btn-quiet shrink-0" onClick={onDisable}>
          {t.off}
        </button>
      </div>

      {result.yearsLeft === null ? (
        <p className="text-sm text-ink-400">{t.ageMissing}</p>
      ) : result.grownUp ? (
        <p className="rounded-xl bg-accent-50 px-3 py-2 text-xs text-accent-600">
          {t.grownUpHint}
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-600">
            {t.timeLeftBefore}
            <span className="numeral">{formatYears(result.yearsLeft)}</span>
            {t.timeLeftAfter}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {result.items.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-ink-200/70 bg-surface px-3 py-2.5"
              >
                <p className="text-[11px] text-ink-400">
                  {item.emoji} {item.label}
                </p>
                <p className="numeral mt-0.5 text-xl text-ink-800">
                  {formatCount(item.count)}
                  <span className="ml-0.5 text-xs font-normal text-ink-400">{t.timesUnit}</span>
                </p>
              </div>
            ))}
          </div>

          {/*
            "아이와 남은 여름 13번"은 이 앱에서 가장 내보이고 싶어지는 숫자다.
            항목이 열 개라 카드 한 장에 다 넣으면 아무것도 읽히지 않으므로 하나만 고른다.
          */}
          {summer && (
            <ShareButton
              spec={{
                emoji: summer.emoji,
                title: name,
                subtitle: t.left(summer.label),
                value: formatCount(summer.count),
                unit: t.timesUnit,
                caption: t.caption(setup.adultAge, formatYears(result.yearsLeft)),
              }}
              fileNameParts={[name, t.leftFile(summer.label), t.times(formatCount(summer.count))]}
            />
          )}
        </>
      )}

      <div className="space-y-4 border-t border-ink-200/70 pt-4">
        <div>
          <label className="label" htmlFor={`${ids}-adult`}>
            {t.adultAge}
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${ids}-adult`}
              className="input w-20"
              type="number"
              min={1}
              max={40}
              value={setup.adultAge}
              onChange={(e) => onChange({ ...setup, adultAge: Number(e.target.value) })}
            />
            <span className="text-sm text-ink-400">{t.ageUnit}</span>
            {ADULT_AGES.map((age) => (
              <button
                key={age}
                type="button"
                className={`chip ${setup.adultAge === age ? "chip-active" : ""}`}
                onClick={() => onChange({ ...setup, adultAge: age })}
              >
                {t.ageChip(age)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FrequencyInput
            label={t.dinners}
            value={setup.dinners}
            onChange={(dinners) => onChange({ ...setup, dinners })}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dinnerPresets().map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`chip ${sameFrequency(setup.dinners, preset.frequency) ? "chip-active" : ""}`}
                onClick={() => onChange({ ...setup, dinners: preset.frequency })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-400">
          {t.note}
        </p>
      </div>
    </div>
  );
}
