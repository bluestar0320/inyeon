"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useRef } from "react";

import NumberInput from "@/components/NumberInput";
import EditConflict, { confirmOverwrite, detectConflict } from "@/components/EditConflict";
import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import SinceField from "@/components/SinceField";
import GrowthCalendar from "@/components/GrowthCalendar";
import LifeSpanFields from "@/components/LifeSpanFields";
import PersonHorizonPicker from "@/components/PersonHorizonPicker";
import ResultPanel from "@/components/ResultPanel";
import YearBreakdown from "@/components/YearBreakdown";
import { computeGrowth, computeRelationship, pastLimit, resolveAge } from "@/lib/calc";
import { formatCount, formatDays, formatFrequency, formatInterval, formatYears, josa } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { relationPresets } from "@/lib/presets";
import { useActions, useAppState } from "@/lib/store";
import { copyFor, horizonPassedSentence } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { confirmLeave, useUnsavedGuard, leaveTo } from "@/lib/unsaved";
import type { GrowthSetup, Person } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    thisPerson: "이 사람",
    ageMissing: "나이나 생년월일을 채우면 남은 만남이 계산됩니다.",
    timesUnit: "번",
    times: (n: string) => `${n}번`,
    interval: "만남 간격",
    together: "함께 보낼 시간",
    togetherSub: "1회 시간 입력 시",
    myTime: "내 남은 시간",
    theirTime: (name: string) => `${name} 남은 시간`,
    name: "이름",
    namePlaceholder: "어머니",
    relation: "관계",
    relationPlaceholder: "가족, 친구 …",
    age: "나이",
    howOften: "얼마나 자주 만나나요",
    hours: "한 번 만나면 몇 시간 (선택)",
    hoursPlaceholder: "예: 6",
    hoursHint: "채우면 남은 만남을 합쳐 실제로 몇 시간이 남았는지 보여줍니다.",
    byYear: "연도별 추이",
    growthOn: "성장 캘린더 켜기",
    growthSuggest: (name: string) =>
      `${josa(name, "이/가")} 성인이 될 때까지 함께 보낼 계절·방학·저녁 식사를 세어 봅니다.`,
    growthHint: "자녀처럼 성인이 되기까지 시간이 남은 경우에 씁니다.",
    note: "메모 (선택)",
    add: "추가하기",
    save: "저장하기",
    cancel: "취소",
    remove: "삭제",
    removed: (name: string) => `${josa(name, "을/를")} 지웠습니다.`,
  },
  en: {
    thisPerson: "this person",
    ageMissing: "Add an age or birthday to count the times ahead.",
    timesUnit: "times",
    times: (n) => `${n} times`,
    interval: "Every",
    together: "Time together",
    togetherSub: "Add hours per visit",
    myTime: "Your time ahead",
    theirTime: (name) => `${name}'s time ahead`,
    name: "Name",
    namePlaceholder: "Mom",
    relation: "Relationship",
    relationPlaceholder: "Family, friend …",
    age: "Age",
    howOften: "How often do you meet?",
    hours: "Hours per visit (optional)",
    hoursPlaceholder: "e.g. 6",
    hoursHint: "Fill this in to see how many hours you still have together.",
    byYear: "Year by year",
    growthOn: "Turn on the growing-up calendar",
    growthSuggest: (name) =>
      `Count the seasons, school breaks and dinners you'll share until ${name} grows up.`,
    growthHint: "For someone, like a child, who still has years before adulthood.",
    note: "Note (optional)",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    remove: "Delete",
    removed: (name) => `Deleted ${name}.`,
  },
  ja: {
    thisPerson: "この人",
    ageMissing: "年齢か誕生日を入れると、これから会える回数を数えます。",
    timesUnit: "回",
    times: (n) => `${n}回`,
    interval: "会う間隔",
    together: "一緒に過ごす時間",
    togetherSub: "1回の時間を入れると表示",
    myTime: "自分の残り時間",
    theirTime: (name) => `${name}の残り時間`,
    name: "名前",
    namePlaceholder: "お母さん",
    relation: "関係",
    relationPlaceholder: "家族、友だち …",
    age: "年齢",
    howOften: "どのくらい会いますか",
    hours: "1回に会う時間（任意）",
    hoursPlaceholder: "例: 6",
    hoursHint: "入れると、これから会える時間が合わせて何時間あるかを表示します。",
    byYear: "年ごとの推移",
    growthOn: "成長カレンダーをオンにする",
    growthSuggest: (name) => `${name}が大人になるまでに一緒に過ごす季節・休み・夕食を数えます。`,
    growthHint: "子どものように、大人になるまで時間がある人に使います。",
    note: "メモ（任意）",
    add: "追加する",
    save: "保存する",
    cancel: "キャンセル",
    remove: "削除",
    removed: (name) => `${name}を削除しました。`,
  },
  es: {
    thisPerson: "esta persona",
    ageMissing: "Añade la edad o la fecha de nacimiento para contar las veces que quedan.",
    timesUnit: "veces",
    times: (n) => `${n} veces`,
    interval: "Cada",
    together: "Tiempo juntos",
    togetherSub: "Añade horas por visita",
    myTime: "Tu tiempo por delante",
    theirTime: (name) => `Tiempo de ${name}`,
    name: "Nombre",
    namePlaceholder: "Mamá",
    relation: "Relación",
    relationPlaceholder: "Familia, amigo …",
    age: "Edad",
    howOften: "¿Cada cuánto os veis?",
    hours: "Horas por visita (opcional)",
    hoursPlaceholder: "p. ej. 6",
    hoursHint: "Si lo rellenas, verás cuántas horas os quedan juntos.",
    byYear: "Año a año",
    growthOn: "Activar el calendario de crecimiento",
    growthSuggest: (name) =>
      `Cuenta las estaciones, vacaciones y cenas que compartiréis hasta que ${name} sea adulto.`,
    growthHint: "Para alguien, como un hijo, a quien aún le faltan años para ser adulto.",
    note: "Nota (opcional)",
    add: "Añadir",
    save: "Guardar",
    cancel: "Cancelar",
    remove: "Eliminar",
    removed: (name) => `Se eliminó a ${name}.`,
  },
  zh: {
    thisPerson: "这个人",
    ageMissing: "填写年龄或生日后，就能算出还能见面的次数。",
    timesUnit: "次",
    times: (n) => `${n}次`,
    interval: "见面间隔",
    together: "相处的时间",
    togetherSub: "填写每次时长后显示",
    myTime: "我剩余的时间",
    theirTime: (name) => `${name}剩余的时间`,
    name: "名字",
    namePlaceholder: "妈妈",
    relation: "关系",
    relationPlaceholder: "家人、朋友 …",
    age: "年龄",
    howOften: "多久见一次面",
    hours: "每次见面几小时（选填）",
    hoursPlaceholder: "例如：6",
    hoursHint: "填写后，会显示还能见面的时间加起来一共有多少小时。",
    byYear: "逐年变化",
    growthOn: "开启成长日历",
    growthSuggest: (name) => `数一数${name}长大成人之前，你们一起度过的季节、假期和晚餐。`,
    growthHint: "适用于像孩子这样，离成年还有一段时间的人。",
    note: "备注（选填）",
    add: "添加",
    save: "保存",
    cancel: "取消",
    remove: "删除",
    removed: (name) => `已删除${name}。`,
  },
});

function defaultGrowth(): GrowthSetup {
  return { adultAge: 20, dinners: { count: 5, unit: "week" } };
}

export default function PersonEditor({ initial }: { initial: Person }) {
  const router = useRouter();
  const { state } = useAppState();
  const { savePerson, removePerson } = useActions();
  const ids = useId();
  // 편집을 시작할 때 저장돼 있던 판(새로 만드는 중이면 null). 다른 창에서 고치거나
  // 지웠는지 견주는 기준이다(components/EditConflict.tsx).
  const [startedAt] = useState(
    () => state.people.find((p) => p.id === initial.id)?.updatedAt ?? null,
  );
  const [draft, setDraft] = useState<Person>(initial);

  const t = tr(COPY);
  const copy = copyFor(state.settings.tone);
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile],
  );
  const isNew = !state.people.some((p) => p.id === draft.id);
  const nameForCopy = draft.name.trim() || draft.relation || t.thisPerson;
  const ageMissing = result.theirYears === null;

  const growth = useMemo(() => computeGrowth(draft), [draft]);
  // 아직 어린 사람이면 캘린더를 먼저 권한다. 켜는 건 어디까지나 사용자가 정한다.
  const theirAge = resolveAge(draft);
  const suggestGrowth = theirAge !== null && theirAge < 20;

  // 새로 만드는 중이면 이름을 한 글자라도 적은 순간부터, 고치는 중이면 저장된
  // 값과 달라진 순간부터 "안 저장됨"으로 본다. updatedAt은 저장할 때만 바뀌므로
  // 비교에서 뺀다.
  const saved = state.people.find((p) => p.id === draft.id);
  // 방금 여기서 저장한 것은 충돌이 아니다(떠나기 전 한 번 그려질 때 알림이 번쩍인다).
  const savedHere = useRef(false);
  const conflict = savedHere.current ? null : detectConflict(startedAt, saved);
  const dirty = saved
    ? JSON.stringify({ ...saved, updatedAt: "" }) !== JSON.stringify({ ...draft, updatedAt: "" })
    : draft.name.trim() !== "" || draft.filters.length > 0;
  useUnsavedGuard(dirty);

  // 고치던 중이었다면 보던 화면으로 돌려보낸다. 목록으로 튕기면 방금 고친 것을
  // 다시 찾아 들어가야 한다.
  const backTo = isNew ? "/people" : `/people/detail?id=${draft.id}`;

  /*
   * 첫 인연만 목록이 아니라 상세로 보낸다.
   * 목록에서는 숫자가 한 줄짜리 작은 글자라, 방금 만든 "232번"이 이 앱의 한 방이라는
   * 게 전달되지 않는다. 상세로 보내면 큰 숫자로 맞는다.
   * 둘째부터는 목록이 낫다 — 여러 명을 이어서 넣을 때 매번 뒤로 가야 하면 번거롭다.
   */
  const afterAdd = state.people.length === 0 ? "/people/detail?id=" + draft.id : "/people";

  function leave(): void {
    if (!confirmLeave()) return;
    leaveTo(router, backTo);
  }

  function save(): void {
    if (!confirmOverwrite(conflict)) return;
    savedHere.current = true;
    savePerson({ ...draft, name: draft.name.trim() || nameForCopy, updatedAt: new Date().toISOString() });
    leaveTo(router, isNew ? afterAdd : `/people/detail?id=${draft.id}`);
  }

  return (
    <div className="space-y-5">
      <EditConflict conflict={conflict} />
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        sentence={copy.meetingSentence(nameForCopy, formatCount(result.total))}
        unknownMessage={
          ageMissing ? t.ageMissing : undefined
        }
        share={{
          emoji: draft.emoji ?? "🫧",
          title: nameForCopy,
          subtitle: copy.meetingLabel,
          value: formatCount(result.total),
          unit: t.timesUnit,
          // 나이와 예상 수명은 넣지 않는다. 남에게 보낼 정보가 아니다.
          caption: `${formatFrequency(draft.frequency)} · ${formatYears(result.sharedYears)}`,
        }}
        shareFileName={[nameForCopy, t.times(formatCount(result.total))]}
        stats={[
          { label: t.interval, value: formatInterval(result.intervalDays) },
          {
            label: t.together,
            value: result.togetherDays === null ? "-" : formatDays(result.togetherDays),
            sub: result.togetherDays === null ? t.togetherSub : undefined,
          },
          { label: t.myTime, value: formatYears(result.myYears) },
          { label: t.theirTime(nameForCopy), value: formatYears(result.theirYears) },
        ]}
      />

      {!ageMissing && (
        <p className="px-1 text-xs text-ink-400">{result.horizonPassed && draft.horizon?.kind === "untilMyAge"
            ? horizonPassedSentence(draft.horizon.age)
            : copy.limitedBySentence(result.limitedBy, nameForCopy)}</p>
      )}

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`${ids}-name`}>
              {t.name}
            </label>
            <input
              id={`${ids}-name`}
              className="input"
              value={draft.name}
              placeholder={t.namePlaceholder}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${ids}-relation`}>
              {t.relation}
            </label>
            <input
              id={`${ids}-relation`}
              className="input"
              value={draft.relation ?? ""}
              placeholder={t.relationPlaceholder}
              onChange={(e) => setDraft({ ...draft, relation: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {relationPresets().map((preset) => (
            <button
              key={preset.relation}
              type="button"
              className="chip"
              onClick={() =>
                setDraft({
                  ...draft,
                  relation: preset.relation,
                  emoji: preset.emoji,
                  name: draft.name || preset.relation,
                  frequency: preset.frequency,
                  hoursPerMeeting: preset.hoursPerMeeting,
                  // 자녀 프리셋은 성장 캘린더까지 한 번에 켠다. 이미 켜 둔 설정은 건드리지 않는다.
                  growth: preset.withGrowth ? (draft.growth ?? defaultGrowth()) : draft.growth,
                })
              }
            >
              {preset.emoji} {preset.relation}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel={t.age} />
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label={t.howOften}
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />
        <SinceField
          value={draft.since}
          frequency={draft.frequency}
          maxYears={pastLimit(theirAge, state.profile ? resolveAge(state.profile) : null)}
          onChange={(since) => setDraft({ ...draft, since })}
        />
        <PersonHorizonPicker
          value={draft.horizon ?? { kind: "life" }}
          myAge={resolveAge(state.profile ?? {})}
          countedYears={result.sharedYears}
          limitedByHorizon={result.limitedBy === "horizon"}
          onChange={(horizon) =>
            setDraft({ ...draft, horizon: horizon.kind === "life" ? undefined : horizon })
          }
        />
        <div>
          <label className="label" htmlFor={`${ids}-hours`}>
            {t.hours}
          </label>
          <NumberInput
            id={`${ids}-hours`}
            className="input w-28"
            min={0}
            max={24}
            step="0.5"
            value={draft.hoursPerMeeting}
            placeholder={t.hoursPlaceholder}
            onChange={(hoursPerMeeting) => setDraft({ ...draft, hoursPerMeeting })}
            onEmpty={() => setDraft({ ...draft, hoursPerMeeting: undefined })}
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {t.hoursHint}
          </p>
        </div>
      </div>

      <div className="card">
        <FilterEditor
          filters={draft.filters}
          onChange={(filters) => setDraft({ ...draft, filters })}
        />
      </div>

      {/* 추이는 조건 바로 아래에 둔다. 위에 두면 입력 칸이 화면 밖으로 밀린다. */}
      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">{t.byYear}</p>
        <YearBreakdown slices={result.slices} />
      </div>

      {growth !== null && draft.growth ? (
        <GrowthCalendar
          name={nameForCopy}
          setup={draft.growth}
          result={growth}
          onChange={(setup) => setDraft({ ...draft, growth: setup })}
          onDisable={() => setDraft({ ...draft, growth: undefined })}
        />
      ) : (
        <button
          type="button"
          className="card flex w-full items-center justify-between border-dashed text-left transition hover:border-ink-400"
          onClick={() => setDraft({ ...draft, growth: defaultGrowth() })}
        >
          <span>
            <span className="block text-sm font-semibold text-ink-800">{t.growthOn}</span>
            <span className="mt-1 block text-xs text-ink-400">
              {suggestGrowth
                ? t.growthSuggest(nameForCopy)
                : t.growthHint}
            </span>
          </span>
          <span className="shrink-0 pl-3 text-xl">🧸</span>
        </button>
      )}

      <div className="card space-y-2">
        <label className="label" htmlFor={`${ids}-note`}>
          {t.note}
        </label>
        <textarea
          id={`${ids}-note`}
          className="input min-h-20"
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="btn-primary" onClick={save} disabled={!draft.name.trim()}>
          {isNew ? t.add : t.save}
        </button>
        <button type="button" className="btn-secondary" onClick={leave}>
          {t.cancel}
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={() => {
              // 지우는 건 저장된 쪽이지 편집 중인 draft가 아니다. 되돌릴 때도
              // 사용자가 마지막으로 저장한 모습 그대로 살아나야 한다.
              removePerson(draft.id);
              if (saved) {
                offerUndo(t.removed(saved.name), () => savePerson(saved));
              }
              // 지우기로 한 이상 편집 중이던 내용은 물어볼 것이 없다.
              leaveTo(router, "/people");
            }}
          >
            {t.remove}
          </button>
        )}
      </div>
    </div>
  );
}
