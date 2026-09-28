"use client";

import { useId } from "react";

import HealthFields from "@/components/HealthFields";
import NumberInput from "@/components/NumberInput";
import { healthAgeOffset } from "@/lib/health";
import { resolveAge } from "@/lib/calc";
import { formatAge, formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { COUNTRIES, lookupLifeExpectancy } from "@/lib/lifeExpectancy";
import { todayISO } from "@/lib/format";
import type { LifeSpan, Sex } from "@/lib/types";

const SEXES: Sex[] = ["all", "female", "male"];

const COPY = defineCopy({
  ko: {
    sex: { all: "구분 없음", female: "여성", male: "남성" } as Record<Sex, string>,
    age: "나이",
    birthDate: "생년월일",
    currentAge: (age: string) => `현재 ${age}`,
    birthUnknown: "모르면 비워 두고 나이만 입력하세요.",
    agePlaceholder: "예: 60",
    ageFromBirth: "생년월일이 있으면 자동으로 계산됩니다.",
    ageHint: "만 나이 기준 · 시간이 지나면 저절로 올라갑니다",
    country: "국가",
    sexLabel: "성별",
    lifeExpectancy: "예상 수명",
    ageUnit: "세",
    reset: (age: number) => `통계값(${age}세)으로 되돌리기`,
    manual: "직접 조정한 값입니다. 나이·국가·성별을 바꿔도 유지됩니다.",
    needAge: "나이를 채우면 그 나이에 맞는 통계값이 적용됩니다. 언제든 직접 바꿀 수 있어요.",
    fromTableWithHealth:
      "생명표에서 이 나이·국가·성별에 맞는 값을 가져오고, 위에서 고른 생활 습관을 반영했습니다. 언제든 직접 바꿀 수 있어요.",
    fromTable: "생명표에서 이 나이·국가·성별에 맞는 값을 가져옵니다. 언제든 직접 바꿀 수 있어요.",
    remaining: (years: string) => ` · 남은 기간 약 ${years}`,
    belowAge: "예상 수명이 지금 나이보다 적어 남은 시간이 0으로 계산됩니다.",
  },
  en: {
    sex: { all: "Not specified", female: "Female", male: "Male" },
    age: "Age",
    birthDate: "Birthday",
    currentAge: (age) => `Now ${age}`,
    birthUnknown: "If you don't know it, leave it blank and just enter the age.",
    agePlaceholder: "e.g. 60",
    ageFromBirth: "Calculated automatically from the birthday.",
    ageHint: "Goes up on its own as time passes",
    country: "Country",
    sexLabel: "Sex",
    lifeExpectancy: "Life expectancy",
    ageUnit: "yrs",
    reset: (age) => `Reset to average (${age})`,
    manual: "Set by you. It stays even if you change age, country or sex.",
    needAge: "Add an age to use the average for that age. You can change it anytime.",
    fromTableWithHealth:
      "Taken from life tables for this age, country and sex, adjusted for the habits above. You can change it anytime.",
    fromTable: "Taken from life tables for this age, country and sex. You can change it anytime.",
    remaining: (years) => ` · about ${years} ahead`,
    belowAge: "Life expectancy is at or below the current age, so the time left counts as 0.",
  },
  ja: {
    sex: { all: "指定なし", female: "女性", male: "男性" },
    age: "年齢",
    birthDate: "生年月日",
    currentAge: (age) => `現在${age}`,
    birthUnknown: "わからなければ空けておき、年齢だけ入れてください。",
    agePlaceholder: "例: 60",
    ageFromBirth: "生年月日から自動で計算されます。",
    ageHint: "満年齢 · 時間がたつと自動で上がります",
    country: "国",
    sexLabel: "性別",
    lifeExpectancy: "予想寿命",
    ageUnit: "歳",
    reset: (age) => `統計値（${age}歳）に戻す`,
    manual: "手動で調整した値です。年齢・国・性別を変えても保たれます。",
    needAge: "年齢を入れると、その年齢に合った統計値が使われます。いつでも自分で変えられます。",
    fromTableWithHealth:
      "生命表からこの年齢・国・性別に合った値を取り、上で選んだ生活習慣を反映しました。いつでも自分で変えられます。",
    fromTable: "生命表からこの年齢・国・性別に合った値を取ります。いつでも自分で変えられます。",
    remaining: (years) => ` · 残り約${years}`,
    belowAge: "予想寿命が今の年齢以下なので、残り時間は0として計算されます。",
  },
  es: {
    sex: { all: "Sin especificar", female: "Mujer", male: "Hombre" },
    age: "Edad",
    birthDate: "Fecha de nacimiento",
    currentAge: (age) => `Ahora ${age}`,
    birthUnknown: "Si no la sabes, déjala en blanco y pon solo la edad.",
    agePlaceholder: "p. ej. 60",
    ageFromBirth: "Se calcula automáticamente a partir de la fecha de nacimiento.",
    ageHint: "Sube sola con el paso del tiempo",
    country: "País",
    sexLabel: "Sexo",
    lifeExpectancy: "Esperanza de vida",
    ageUnit: "años",
    reset: (age) => `Volver a la media (${age} años)`,
    manual: "Ajustado por ti. Se mantiene aunque cambies la edad, el país o el sexo.",
    needAge: "Añade la edad para usar la media correspondiente. Puedes cambiarla cuando quieras.",
    fromTableWithHealth:
      "Tomado de las tablas de vida para esta edad, país y sexo, con los hábitos de arriba. Puedes cambiarlo cuando quieras.",
    fromTable: "Tomado de las tablas de vida para esta edad, país y sexo. Puedes cambiarlo cuando quieras.",
    remaining: (years) => ` · unos ${years} por delante`,
    belowAge: "La esperanza de vida no supera la edad actual, así que el tiempo restante cuenta como 0.",
  },
  zh: {
    sex: { all: "不区分", female: "女", male: "男" },
    age: "年龄",
    birthDate: "出生日期",
    currentAge: (age) => `现在${age}`,
    birthUnknown: "不知道的话可以留空，只填年龄。",
    agePlaceholder: "例如：60",
    ageFromBirth: "有出生日期时会自动计算。",
    ageHint: "按周岁计算 · 会随时间自动增长",
    country: "国家/地区",
    sexLabel: "性别",
    lifeExpectancy: "预期寿命",
    ageUnit: "岁",
    reset: (age) => `恢复为统计值（${age}岁）`,
    manual: "这是你手动调整的值。更改年龄、国家或性别也会保留。",
    needAge: "填写年龄后，会使用与该年龄相符的统计值。随时可以自己修改。",
    fromTableWithHealth: "取自生命表中与该年龄、国家、性别相符的值，并反映了上面选择的生活习惯。随时可以自己修改。",
    fromTable: "取自生命表中与该年龄、国家、性别相符的值。随时可以自己修改。",
    remaining: (years) => ` · 大约还有${years}`,
    belowAge: "预期寿命不高于现在的年龄，剩余时间按0计算。",
  },
});

/**
 * 나이 + 예상 수명을 다루는 입력 묶음. 내 프로필과 인연 카드가 같은 규칙을 쓰므로
 * 한 컴포넌트로 공유한다. 국가/성별을 바꾸면 평균 수명이 따라오지만, 사용자가 직접
 * 손대는 순간(lifeExpectancyManual) 그 값을 존중하고 더는 덮어쓰지 않는다.
 */
export default function LifeSpanFields<T extends LifeSpan>({
  value,
  onChange,
  ageLabel,
  showHealth = false,
}: {
  value: T;
  onChange: (next: T) => void;
  ageLabel?: string;
  /*
   * 생활 습관 칸을 띄울지. 지금은 내 프로필에서만 켠다 — 남의 흡연 여부를 물어
   * 채우게 하는 건 번거롭고 주제넘다. 여기 두는 이유는 습관을 바꾸면 예상 수명을
   * 다시 계산해야 하는데, 그 재계산이 이 컴포넌트의 patch()에 있기 때문이다.
   */
  showHealth?: boolean;
}) {
  const t = tr(COPY);
  const ids = useId();
  const age = resolveAge(value);
  const remaining = age === null ? null : Math.max(0, value.lifeExpectancy - age);
  // 예상 수명은 나이에 따라 달라진다. 이미 그 나이까지 살아온 사람은 일찍 떠난
  // 사람들이 끌어내린 출생 시 평균보다 더 오래 산다.
  const average = lookupLifeExpectancy(value.countryCode, value.sex, age, value.health);

  function patch(changes: Partial<LifeSpan>): void {
    const next = { ...value, ...changes } as T;
    if (!next.lifeExpectancyManual) {
      next.lifeExpectancy = lookupLifeExpectancy(
        next.countryCode,
        next.sex,
        resolveAge(next),
        next.health,
      );
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${ids}-birth`}>
            {t.birthDate}
          </label>
          <input
            id={`${ids}-birth`}
            className="input"
            type="date"
            value={value.birthDate ?? ""}
            max={todayISO()}
            onChange={(e) => patch({ birthDate: e.target.value || undefined })}
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {value.birthDate ? t.currentAge(formatAge(age)) : t.birthUnknown}
          </p>
        </div>
        <div>
          <label className="label" htmlFor={`${ids}-age`}>
            {ageLabel ?? t.age}
          </label>
          <NumberInput
            id={`${ids}-age`}
            className="input"
            min={0}
            max={120}
            value={value.ageYears}
            disabled={Boolean(value.birthDate)}
            placeholder={t.agePlaceholder}
            // 적어 넣은 날짜를 같이 남겨야 나이가 시간과 함께 늙는다.
            onChange={(next) => patch({ ageYears: next, ageAsOf: todayISO() })}
            onEmpty={() => patch({ ageYears: undefined, ageAsOf: undefined })}
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {value.birthDate
              ? t.ageFromBirth
              : t.ageHint}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${ids}-country`}>
            {t.country}
          </label>
          <select
            id={`${ids}-country`}
            className="input"
            value={value.countryCode ?? ""}
            onChange={(e) => patch({ countryCode: e.target.value || undefined })}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="label">{t.sexLabel}</span>
          <div className="flex gap-1.5" role="group" aria-label={t.sexLabel}>
            {SEXES.map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => patch({ sex })}
                className={`chip ${value.sex === sex ? "chip-active" : ""}`}
              >
                {t.sex[sex]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showHealth && (
        <HealthFields
          value={value.health}
          age={age}
          onChange={(health) => patch({ health })}
        />
      )}

      <div>
        <label className="label" htmlFor={`${ids}-expectancy`}>
          {t.lifeExpectancy}
        </label>
        <div className="flex items-center gap-2">
          <NumberInput
            id={`${ids}-expectancy`}
            className="input w-28"
            min={1}
            max={130}
            step="0.1"
            value={value.lifeExpectancy}
            onChange={(lifeExpectancy) =>
              onChange({ ...value, lifeExpectancy, lifeExpectancyManual: true } as T)
            }
          />
          <span className="text-sm text-ink-400">{t.ageUnit}</span>
          {value.lifeExpectancyManual && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() =>
                onChange({
                  ...value,
                  lifeExpectancy: average,
                  lifeExpectancyManual: false,
                } as T)
              }
            >
              {t.reset(average)}
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
          {value.lifeExpectancyManual
            ? t.manual
            : age === null
              ? t.needAge
              : showHealth && healthAgeOffset(value.health) !== 0
                ? t.fromTableWithHealth
                : t.fromTable}
          {remaining !== null && t.remaining(formatYears(remaining))}
        </p>
        {value.lifeExpectancyManual && age !== null && value.lifeExpectancy <= age && (
          <p className="mt-1 text-[11px] leading-relaxed text-ink-600">{t.belowAge}</p>
        )}
      </div>
    </div>
  );
}
