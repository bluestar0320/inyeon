"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useRef } from "react";

import MoreDetails from "@/components/MoreDetails";
import NumberInput from "@/components/NumberInput";
import ConsentCheck, { useConsent } from "@/components/ConsentCheck";
import { hintFor } from "@/components/DecayHint";
import { count } from "@/lib/analytics";
import EditConflict, { confirmOverwrite, detectConflict } from "@/components/EditConflict";
import FilterEditor from "@/components/FilterEditor";
import FrequencyInput from "@/components/FrequencyInput";
import SinceField from "@/components/SinceField";
import LifeSpanFields from "@/components/LifeSpanFields";
import PersonHorizonPicker from "@/components/PersonHorizonPicker";
import ResultPanel from "@/components/ResultPanel";
import YearBreakdown from "@/components/YearBreakdown";
import { computeRelationship, pastLimit, resolveAge, toPerYear } from "@/lib/calc";
import { formatCount, formatDays, formatFrequency, formatInterval, formatYears, josa } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { imageFor } from "@/lib/photos";
import { relationPresets } from "@/lib/presets";
import { pairTitle } from "@/lib/shareCard";
import { useActions, useAppState } from "@/lib/store";
import { copyFor, horizonPassedSentence } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import { confirmLeave, useUnsavedGuard, leaveTo, blockImeEnter } from "@/lib/unsaved";
import type { Person } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    more: "더 자세히",
    moreSummary: "언제부터 · 세는 기간 · 한 번에 몇 시간",
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
    add: "추가하기",
    save: "저장하기",
    cancel: "취소",
    remove: "삭제",
    removed: (name: string) => `${josa(name, "을/를")} 지웠습니다.`,
  },
  en: {
    more: "More details",
    moreSummary: "Since when · How long · Hours per visit",
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
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    remove: "Delete",
    removed: (name) => `Deleted ${name}.`,
  },
  ja: {
    more: "くわしく",
    moreSummary: "いつから · 数える期間 · 1回の時間",
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
    add: "追加する",
    save: "保存する",
    cancel: "キャンセル",
    remove: "削除",
    removed: (name) => `${name}を削除しました。`,
  },
  es: {
    more: "Más detalles",
    moreSummary: "Desde cuándo · Periodo · Horas por visita",
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
    add: "Añadir",
    save: "Guardar",
    cancel: "Cancelar",
    remove: "Eliminar",
    removed: (name) => `Se eliminó a ${name}.`,
  },
  zh: {
    more: "更多",
    moreSummary: "从何时 · 计算期间 · 每次几小时",
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
    add: "添加",
    save: "保存",
    cancel: "取消",
    remove: "删除",
    removed: (name) => `已删除${name}。`,
  },
});

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
  const presets = relationPresets();
  const copy = copyFor(state.settings.tone);
  const result = useMemo(
    () => computeRelationship(draft, state.profile),
    [draft, state.profile],
  );
  const isNew = !state.people.some((p) => p.id === draft.id);
  const nameForCopy = draft.name.trim() || draft.relation || t.thisPerson;
  const ageMissing = result.theirYears === null;

  // 아직 어린 사람이면 캘린더를 먼저 권한다. 켜는 건 어디까지나 사용자가 정한다.
  const theirAge = resolveAge(draft);

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

  const consent = useConsent();

  function save(): void {
    if (!confirmOverwrite(conflict)) return;
    consent.commit();
    // 첫 인연을 세운 순간만 센다(누구인지는 보내지 않는다).
    if (isNew && state.people.length === 0) count({ event: "first-person" });
    savedHere.current = true;
    savePerson({ ...draft, name: draft.name.trim() || nameForCopy, updatedAt: new Date().toISOString() });
    leaveTo(router, isNew ? afterAdd : `/people/detail?id=${draft.id}`);
  }

  return (
    /*
     * form으로 감싸 입력 칸에서 Enter를 누르면 저장되게 한다. 브라우저는 제출 단추가
     * 있는 form에서만 Enter를 제출로 받으므로 저장 단추를 type="submit"으로 둔다.
     * 저장 단추가 꺼져 있으면(이름이 비었을 때) Enter도 제출하지 않는다.
     */
    <form
      className="space-y-5"
      noValidate
      onKeyDown={blockImeEnter}
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.name.trim() && !consent.blocking) save();
      }}
    >
      <EditConflict conflict={conflict} />
      <ResultPanel
        label={copy.meetingLabel}
        result={result}
        sentence={copy.meetingSentence(nameForCopy, formatCount(result.total))}
        unknownMessage={
          ageMissing ? t.ageMissing : undefined
        }
        share={{
          photo: imageFor(draft),
          label: nameForCopy,
          title: pairTitle(nameForCopy),
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

      {/* 한 사람에 대한 것은 한 카드에. 프리셋이 먼저다 — 누르면 대부분이 채워진다. */}
      <div className="card space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="chip"
              onClick={() =>
                setDraft({
                  ...draft,
                  relation: preset.relation,
                  // 이모지는 화면에 보이지 않고 폴라로이드 사진을 고르는 데만 쓴다(lib/photos.ts).
                  emoji: preset.emoji,
                  // 비어 있거나 다른 단추가 넣은 이름이면 바꾼다. 직접 쓴 이름은 지키고.
                  name: !draft.name.trim() || presets.some((p) => p.label === draft.name) ? preset.label : draft.name,
                  frequency: preset.frequency,
                  hoursPerMeeting: preset.hoursPerMeeting,
                })
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
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
        <div className="border-t border-ink-200/70 pt-4">
          <LifeSpanFields value={draft} onChange={setDraft} ageLabel={t.age} />
        </div>
      </div>

      <div className="card space-y-4">
        <FrequencyInput
          label={t.howOften}
          value={draft.frequency}
          onChange={(frequency) => setDraft({ ...draft, frequency })}
        />
        <MoreDetails
          label={t.more}
          summary={t.moreSummary}
          openWhen={Boolean(draft.since) || Boolean(draft.horizon) || draft.hoursPerMeeting !== undefined}
        >
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
        </MoreDetails>
      </div>

      {/* 조건과 그 결과(연도별 추이)는 한 카드에. 걸면 바로 아래에서 달라지는 게 보인다. */}
      <div className="card space-y-4">
        <FilterEditor
          filters={draft.filters}
          onChange={(filters) => setDraft({ ...draft, filters })}
          basePerYear={toPerYear(draft.frequency)}
          hint={hintFor(draft.emoji, "person")}
        />
        <div className="border-t border-ink-200/70 pt-3">
          <MoreDetails label={t.byYear} openWhen={draft.filters.length > 0}>
            <YearBreakdown slices={result.slices} />
          </MoreDetails>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary" disabled={!draft.name.trim() || consent.blocking}>
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
      {isNew && <ConsentCheck consent={consent} />}
    </form>
  );
}
