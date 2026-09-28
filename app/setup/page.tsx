"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LifeSpanFields from "@/components/LifeSpanFields";
import { remainingYears } from "@/lib/calc";
import { formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { emptyProfile, useActions, useAppState } from "@/lib/store";
import { confirmLeave, useUnsavedGuard, leaveTo } from "@/lib/unsaved";
import type { Profile } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    title: "내 정보",
    subtitle: "모든 계산의 기준이 됩니다. 기기 안에만 저장되고 서버로 보내지 않습니다.",
    ageLabel: "내 나이",
    remaining: "앞으로 남은 시간",
    lifeTableNote:
      "예상 수명은 나이·국가·성별에 맞는 생명표 값을 씁니다. 흔히 말하는 “평균 수명 83.5세”는 갓 태어난 사람 기준이라, 이미 그 나이까지 살아온 사람에게는 맞지 않습니다. 그래서 나이를 넣으면 숫자가 조금 올라갑니다. 물론 직접 바꿀 수도 있습니다.",
    save: "저장하기",
    cancel: "취소",
    needAge: "생년월일이나 나이를 먼저 채워 주세요.",
  },
  en: {
    title: "My details",
    subtitle: "Everything is counted from here. It stays on this device and is never sent to a server.",
    ageLabel: "My age",
    remaining: "Time ahead",
    lifeTableNote:
      "Life expectancy comes from life tables matched to your age, country, and sex. The familiar “average lifespan of 83.5” is measured from birth, so it doesn't fit someone who has already reached your age. That's why the number rises a little once you enter your age. You can always change it yourself.",
    save: "Save",
    cancel: "Cancel",
    needAge: "Please enter your date of birth or age first.",
  },
  ja: {
    title: "自分の情報",
    subtitle: "すべての計算の基準になります。端末の中にだけ保存され、サーバーには送りません。",
    ageLabel: "自分の年齢",
    remaining: "これからの時間",
    lifeTableNote:
      "予想寿命は、年齢・国・性別に合った生命表の値を使います。よく言われる「平均寿命83.5歳」は生まれたばかりの人が基準なので、すでにその年齢まで生きてきた人には当てはまりません。そのため、年齢を入れると数字が少し上がります。もちろん自分で変えることもできます。",
    save: "保存する",
    cancel: "キャンセル",
    needAge: "先に生年月日か年齢を入力してください。",
  },
  es: {
    title: "Mis datos",
    subtitle: "Es la base de todos los cálculos. Se guarda solo en este dispositivo y nunca se envía a un servidor.",
    ageLabel: "Mi edad",
    remaining: "Tiempo por delante",
    lifeTableNote:
      "La esperanza de vida sale de tablas de mortalidad según tu edad, país y sexo. La conocida “esperanza de vida de 83,5 años” se mide al nacer, así que no encaja con quien ya ha llegado a tu edad. Por eso el número sube un poco al introducir tu edad. Y siempre puedes cambiarlo tú.",
    save: "Guardar",
    cancel: "Cancelar",
    needAge: "Primero indica tu fecha de nacimiento o tu edad.",
  },
  zh: {
    title: "我的信息",
    subtitle: "这是所有计算的基准。只保存在设备上，不会发送到服务器。",
    ageLabel: "我的年龄",
    remaining: "今后的时间",
    lifeTableNote:
      "预期寿命采用与年龄、国家、性别相符的生命表数值。常说的“平均寿命83.5岁”是以刚出生的人为基准的，并不适用于已经活到这个年龄的人。所以填入年龄后，数字会稍微上升。当然，你也可以自己修改。",
    save: "保存",
    cancel: "取消",
    needAge: "请先填写出生日期或年龄。",
  },
});

export default function SetupPage() {
  const t = tr(COPY);
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const { saveProfile } = useActions();
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = useState(false);

  // 저장된 프로필은 하이드레이션 뒤에야 들어오므로, 한 번만 폼에 옮겨 담는다.
  useEffect(() => {
    if (!hydrated || loaded) return;
    if (state.profile) setDraft(state.profile);
    setLoaded(true);
  }, [hydrated, loaded, state.profile]);

  const remaining = remainingYears(draft);

  const baseline = state.profile ?? emptyProfile();
  const dirty = loaded && JSON.stringify(baseline) !== JSON.stringify(draft);
  useUnsavedGuard(dirty);

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {t.subtitle}
        </p>
      </div>

      <div className="card">
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel={t.ageLabel} showHealth />
      </div>

      <div className="card">
        <p className="text-xs font-medium text-ink-400">{t.remaining}</p>
        <p className="numeral mt-1 text-4xl text-ink-900">{formatYears(remaining)}</p>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-ink-400">
        {t.lifeTableNote}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={remaining === null}
          onClick={() => {
            saveProfile(draft);
            /*
             * 사람을 때리는 건 "47년"이 아니라 "엄마 232번"이다.
             * 그런데 저장하고 빈 홈으로 보내면 약한 숫자를 먼저 보여주고, 센 숫자는
             * 사용자가 알아서 두 화면을 더 거쳐야 나온다. 처음 들어온 사람은
             * 거기서 멈춘다. 그래서 첫 설정일 때만 바로 첫 인연을 세우러 보낸다.
             * 나중에 내 정보를 고치러 다시 온 경우는 그대로 홈으로 돌아간다.
             */
            const first = state.profile === null && state.people.length === 0;
            leaveTo(router, first ? "/people/new" : "/");
          }}
        >
          {t.save}
        </button>
        {state.profile && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!confirmLeave()) return;
              leaveTo(router, "/");
            }}
          >
            {t.cancel}
          </button>
        )}
      </div>
      {remaining === null && (
        <p className="px-1 text-xs text-accent-600">{t.needAge}</p>
      )}
    </div>
  );
}
