"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import InstallButton from "@/components/InstallButton";
import { CONTACT_EMAIL } from "@/lib/contact";
import { todayISO } from "@/lib/format";
import { LANGS, defineCopy, locale, tr } from "@/lib/i18n";
import { LIFE_TABLE_YEAR } from "@/lib/lifeTable";
import { isNativeApp, shareFileNatively } from "@/lib/nativeShare";
import { exportState, looksLikeBackup, useActions, useAppState } from "@/lib/store";
import { offerUndo } from "@/lib/undo";
import { TONE_ORDER, copyFor } from "@/lib/tone";
import type { Theme } from "@/lib/types";

const THEMES: Theme[] = ["system", "light", "dark"];

const COPY = defineCopy({
  ko: {
    groupView: "보기",
    groupData: "기록",
    groupApp: "앱",
    loading: "불러오는 중…",
    title: "설정",
    languageTitle: "언어",
    languageHint: "자동을 고르면 기기 언어를 따라갑니다.",
    languageAuto: "자동",
    toneTitle: "숫자의 무게",
    toneHint: "계산 결과는 같고 문장만 달라집니다.",
    sampleName: "어머니",
    pastTitle: "지금까지도 함께 보기",
    pastHint:
      "“언제부터”를 넣은 인연과 순간에 지나온 횟수를 같이 보여줍니다. 실제로 만난 기록이 아니라, 그동안 빈도가 유지됐다고 봤을 때의 어림값입니다.",
    show: "보기",
    hide: "숨기기",
    themeTitle: "화면",
    themeHint: "시스템을 고르면 기기 설정을 따라갑니다.",
    themes: { system: "시스템", light: "밝게", dark: "어둡게" } as Record<Theme, string>,
    installTitle: "홈 화면에 두기",
    installHint:
      "설치하면 앱 서랍에 자기 아이콘으로 들어가고, 받아 둔 화면으로 인터넷 없이도 열립니다. 기록은 그대로 이어집니다.",
    dataTitle: "내 데이터",
    dataHint:
      "모든 기록은 이 브라우저 안에만 있습니다. 서버로 보내지 않으므로 기기를 바꾸면 내보내기 파일로 옮겨야 합니다. 앱을 지우거나 브라우저 데이터를 비워도 사라지니, 가끔 내보내 두세요.",
    lastBackup: (date: string) => `마지막 내보내기: ${date}`,
    neverBackedUp: "아직 내보낸 적이 없습니다.",
    people: "인연",
    moments: "순간",
    export: "내보내기",
    import: "불러오기",
    exportFailed: "내보내지 못했습니다. 다시 시도해 주세요.",
    readFailed: "파일을 읽지 못했습니다. 내보내기로 만든 JSON인지 확인해 주세요.",
    notBackup: "이 앱에서 내보낸 파일이 아닙니다. 지금 기록은 그대로 두었습니다.",
    imported: "불러왔습니다.",
    filePrefix: "몇번더",
    tooLarge: "파일이 너무 커서 이 기기에 저장하지 못했습니다. 지금 기록은 그대로 두었습니다.",
    overwritten: (n: number) => `${n}개를 덮어썼습니다.`,
    privacyLink: "개인정보 안내",
    feedbackTitle: "의견 보내기",
    feedbackHint:
      "쓰다가 막힌 곳, 이상한 숫자, 있었으면 하는 것 — 뭐든 좋습니다. 메일 앱이 열리고, 보내기 전에 지우거나 고칠 수 있습니다.",
    feedbackSubject: "[몇 번 더] 의견",
    feedbackQuestions: [
      "1. 숫자를 보고 무슨 생각이 들었나요?",
      "2. 누군가에게 보여주고 싶었나요? 누구에게?",
      "3. 쓰다가 막히거나 헷갈린 곳이 있었나요?",
      "4. 그 밖에 하고 싶은 말",
    ],
    clearTitle: "전체 삭제",
    clearHint: "지운 직후 잠깐만 되돌릴 수 있고, 그 뒤에는 방법이 없습니다. 먼저 내보내기를 권합니다.",
    clearConfirm: "정말 지우기",
    cancel: "취소",
    cleared: "모두 지웠습니다.",
    lifeTitle: "예상 수명 데이터",
    lifeSource: (year: number) =>
      `UN 세계인구전망(World Population Prospects 2024)의 연령별 생명표(${year}년)를 앱에 내장해 씁니다. 37개국을 나이·성별로 나눠 담고 있어서, 같은 나라 사람이라도 나이에 따라 다른 값이 나옵니다. 통계청 공표치와는 1년 안쪽으로 차이가 날 수 있습니다.`,
    lifeWhy:
      "흔히 말하는 “평균 수명 83.5세”는 갓 태어난 사람 기준입니다. 이미 68세까지 살아온 분은 일찍 떠난 분들이 끌어내린 그 평균에 해당하지 않아, 실제로는 더 오래 사십니다. 그래서 나이별 표를 그대로 씁니다.",
    lifeEditable: "예상 수명은 언제든 직접 바꿀 수 있습니다.",
  },
  en: {
    groupView: "Display",
    groupData: "Your records",
    groupApp: "App",
    loading: "Loading…",
    title: "Settings",
    languageTitle: "Language",
    languageHint: "Auto follows your device language.",
    languageAuto: "Auto",
    toneTitle: "Tone",
    toneHint: "The numbers stay the same; only the wording changes.",
    sampleName: "Mom",
    pastTitle: "Show the times so far",
    pastHint:
      "For people and moments with a “since” date, also shows how many times have already passed. It's not a record of real meetings, just an estimate assuming the same frequency all along.",
    show: "Show",
    hide: "Hide",
    themeTitle: "Appearance",
    themeHint: "System follows your device setting.",
    themes: { system: "System", light: "Light", dark: "Dark" },
    installTitle: "Add to home screen",
    installHint:
      "Once installed, it gets its own icon in your app drawer and opens even offline. Your records carry over as they are.",
    dataTitle: "My data",
    dataHint:
      "Everything stays in this browser. Nothing is sent to a server, so when you switch devices, move it with an export file. Uninstalling the app or clearing browser data erases it too, so export now and then.",
    lastBackup: (date: string) => `Last export: ${date}`,
    neverBackedUp: "You haven't exported yet.",
    people: "People",
    moments: "Moments",
    export: "Export",
    import: "Import",
    exportFailed: "Couldn't export. Please try again.",
    readFailed: "Couldn't read the file. Make sure it's a JSON file made with Export.",
    notBackup: "This file wasn't exported from this app. Your current records are untouched.",
    imported: "Imported.",
    filePrefix: "how-many-more",
    tooLarge: "The file is too large to save on this device. Your current records are unchanged.",
    overwritten: (n: number) => `Replaced ${n} ${n === 1 ? "item" : "items"}.`,
    privacyLink: "Privacy",
    feedbackTitle: "Send feedback",
    feedbackHint:
      "Where you got stuck, a number that looked off, something you wish it had — anything helps. Your mail app opens, and you can edit or delete anything before sending.",
    feedbackSubject: "[How Many More] Feedback",
    feedbackQuestions: [
      "1. What did you think when you saw the numbers?",
      "2. Did you want to show it to someone? Who?",
      "3. Was anything confusing, or did you get stuck anywhere?",
      "4. Anything else you'd like to say",
    ],
    clearTitle: "Delete everything",
    clearHint:
      "You can undo for a moment right after deleting, but not after that. We recommend exporting first.",
    clearConfirm: "Yes, delete",
    cancel: "Cancel",
    cleared: "Everything was deleted.",
    lifeTitle: "Life expectancy data",
    lifeSource: (year: number) =>
      `The app includes the UN World Population Prospects 2024 life tables by age (${year}). They cover 37 countries by age and sex, so people from the same country get different values depending on their age. Figures may differ from official national statistics by up to a year.`,
    lifeWhy:
      "The familiar “average life expectancy” is measured from birth. Someone who has already reached 68 isn't pulled down by those who passed away young, so they can expect to live longer than that. That's why the app uses the table by age.",
    lifeEditable: "You can change life expectancy yourself at any time.",
  },
  ja: {
    groupView: "表示",
    groupData: "記録",
    groupApp: "アプリ",
    loading: "読み込み中…",
    title: "設定",
    languageTitle: "言語",
    languageHint: "自動を選ぶと端末の言語に合わせます。",
    languageAuto: "自動",
    toneTitle: "数字の重み",
    toneHint: "計算結果は同じで、言い回しだけが変わります。",
    sampleName: "お母さん",
    pastTitle: "これまでの回数も表示",
    pastHint:
      "「いつから」を入れた大切な人とひとときに、これまでの回数も表示します。実際に会った記録ではなく、同じ頻度が続いていたとした場合の目安です。",
    show: "表示",
    hide: "非表示",
    themeTitle: "画面",
    themeHint: "システムを選ぶと端末の設定に合わせます。",
    themes: { system: "システム", light: "ライト", dark: "ダーク" },
    installTitle: "ホーム画面に追加",
    installHint:
      "インストールするとアプリ一覧に専用のアイコンが入り、保存済みの画面でオフラインでも開けます。記録はそのまま引き継がれます。",
    dataTitle: "マイデータ",
    dataHint:
      "記録はすべてこのブラウザの中だけにあります。サーバーには送らないので、端末を替えるときはエクスポートしたファイルで移してください。アプリを削除したりブラウザのデータを消したりしても消えるので、ときどきエクスポートしておきましょう。",
    lastBackup: (date: string) => `最後のエクスポート: ${date}`,
    neverBackedUp: "まだエクスポートしていません。",
    people: "大切な人",
    moments: "ひととき",
    export: "エクスポート",
    import: "インポート",
    exportFailed: "エクスポートできませんでした。もう一度お試しください。",
    readFailed: "ファイルを読み込めませんでした。エクスポートで作ったJSONか確認してください。",
    notBackup: "このアプリからエクスポートしたファイルではありません。今の記録はそのままです。",
    imported: "インポートしました。",
    filePrefix: "あと何回",
    tooLarge: "ファイルが大きすぎて、この端末に保存できませんでした。今の記録はそのままです。",
    overwritten: (n: number) => `${n}件を上書きしました。`,
    privacyLink: "個人情報について",
    feedbackTitle: "ご意見を送る",
    feedbackHint:
      "迷ったところ、おかしな数字、あったらいいもの — なんでも歓迎です。メールアプリが開き、送る前に消したり直したりできます。",
    feedbackSubject: "[あと何回] ご意見",
    feedbackQuestions: [
      "1. 数字を見てどう感じましたか？",
      "2. 誰かに見せたくなりましたか？ 誰に？",
      "3. 使っていて迷ったり、わかりにくかったりしたところは？",
      "4. そのほか伝えたいこと",
    ],
    clearTitle: "すべて削除",
    clearHint: "削除した直後だけ少しの間元に戻せますが、その後は戻せません。先にエクスポートをおすすめします。",
    clearConfirm: "削除する",
    cancel: "キャンセル",
    cleared: "すべて削除しました。",
    lifeTitle: "平均余命のデータ",
    lifeSource: (year: number) =>
      `国連「世界人口推計2024」（World Population Prospects 2024）の年齢別生命表（${year}年）をアプリに内蔵しています。37か国を年齢・性別ごとに収めているので、同じ国の人でも年齢によって値が変わります。各国の公式統計とは1年以内の差が出ることがあります。`,
    lifeWhy:
      "よく言われる「平均寿命」は生まれたばかりの人が基準です。すでに68歳まで生きてきた方は、若くして亡くなった方に引き下げられたその平均には当てはまらず、実際にはもっと長く生きられます。だから年齢別の表をそのまま使います。",
    lifeEditable: "平均余命はいつでも自分で変えられます。",
  },
  es: {
    groupView: "Vista",
    groupData: "Tus registros",
    groupApp: "App",
    loading: "Cargando…",
    title: "Ajustes",
    languageTitle: "Idioma",
    languageHint: "Automático sigue el idioma del dispositivo.",
    languageAuto: "Automático",
    toneTitle: "El peso de los números",
    toneHint: "El cálculo es el mismo; solo cambian las frases.",
    sampleName: "Mamá",
    pastTitle: "Mostrar también las veces pasadas",
    pastHint:
      "En las personas y momentos con fecha de «desde», muestra también cuántas veces han pasado ya. No es un registro real de encuentros, sino una estimación suponiendo la misma frecuencia todo ese tiempo.",
    show: "Mostrar",
    hide: "Ocultar",
    themeTitle: "Apariencia",
    themeHint: "Sistema sigue el ajuste del dispositivo.",
    themes: { system: "Sistema", light: "Claro", dark: "Oscuro" },
    installTitle: "Añadir a la pantalla de inicio",
    installHint:
      "Al instalarla tendrá su propio icono entre tus apps y se abrirá incluso sin conexión. Tus registros se mantienen tal cual.",
    dataTitle: "Mis datos",
    dataHint:
      "Todo se guarda solo en este navegador. No se envía a ningún servidor, así que al cambiar de dispositivo tendrás que pasarlo con un archivo exportado. Si desinstalas la app o borras los datos del navegador, también se pierde, así que exporta de vez en cuando.",
    lastBackup: (date: string) => `Última exportación: ${date}`,
    neverBackedUp: "Aún no has exportado nada.",
    people: "Personas",
    moments: "Momentos",
    export: "Exportar",
    import: "Importar",
    exportFailed: "No se pudo exportar. Inténtalo de nuevo.",
    readFailed: "No se pudo leer el archivo. Comprueba que sea el JSON creado con Exportar.",
    notBackup: "Este archivo no se exportó desde esta app. Tus registros actuales siguen igual.",
    imported: "Importado.",
    filePrefix: "cuantas-veces-mas",
    tooLarge: "El archivo es demasiado grande para guardarlo en este dispositivo. Tus registros no han cambiado.",
    overwritten: (n: number) => `Se reemplazaron ${n} ${n === 1 ? "elemento" : "elementos"}.`,
    privacyLink: "Privacidad",
    feedbackTitle: "Enviar comentarios",
    feedbackHint:
      "Dónde te atascaste, un número raro, algo que echas en falta: todo sirve. Se abrirá tu app de correo y podrás borrar o cambiar lo que quieras antes de enviar.",
    feedbackSubject: "[Cuántas veces más] Comentarios",
    feedbackQuestions: [
      "1. ¿Qué pensaste al ver los números?",
      "2. ¿Quisiste enseñárselo a alguien? ¿A quién?",
      "3. ¿Hubo algo que te confundiera o donde te atascaras?",
      "4. Cualquier otra cosa que quieras decir",
    ],
    clearTitle: "Borrar todo",
    clearHint:
      "Justo después de borrar podrás deshacerlo un momento; después, ya no. Te recomendamos exportar antes.",
    clearConfirm: "Sí, borrar",
    cancel: "Cancelar",
    cleared: "Se borró todo.",
    lifeTitle: "Datos de esperanza de vida",
    lifeSource: (year: number) =>
      `La app incluye las tablas de vida por edad (${year}) de las Perspectivas de la Población Mundial 2024 de la ONU (World Population Prospects 2024). Cubren 37 países por edad y sexo, así que personas del mismo país obtienen valores distintos según su edad. Pueden diferir de las cifras oficiales de cada país en menos de un año.`,
    lifeWhy:
      "La conocida «esperanza de vida media» se mide desde el nacimiento. Quien ya ha llegado a los 68 no entra en esa media que rebajan quienes se fueron jóvenes, así que en realidad vivirá más. Por eso se usa la tabla por edad tal cual.",
    lifeEditable: "Puedes cambiar la esperanza de vida tú mismo cuando quieras.",
  },
  zh: {
    groupView: "显示",
    groupData: "记录",
    groupApp: "应用",
    loading: "加载中…",
    title: "设置",
    languageTitle: "语言",
    languageHint: "选择自动时跟随设备语言。",
    languageAuto: "自动",
    toneTitle: "数字的分量",
    toneHint: "计算结果不变，只是说法不同。",
    sampleName: "妈妈",
    pastTitle: "同时显示至今的次数",
    pastHint:
      "为填了“从何时开始”的亲友和时光，一并显示已经过去的次数。这不是真实的见面记录，而是假设一直保持同样频率时的估算。",
    show: "显示",
    hide: "隐藏",
    themeTitle: "外观",
    themeHint: "选择系统时跟随设备设置。",
    themes: { system: "系统", light: "浅色", dark: "深色" },
    installTitle: "添加到主屏幕",
    installHint: "安装后会在应用列表里有自己的图标，没有网络也能打开已保存的页面。记录会原样保留。",
    dataTitle: "我的数据",
    dataHint:
      "所有记录只保存在这个浏览器里，不会发送到服务器。换设备时需要用导出的文件迁移。卸载应用或清除浏览器数据也会让记录消失，请不时导出一份。",
    lastBackup: (date: string) => `上次导出：${date}`,
    neverBackedUp: "还没有导出过。",
    people: "亲友",
    moments: "时光",
    export: "导出",
    import: "导入",
    exportFailed: "导出失败，请再试一次。",
    readFailed: "无法读取文件。请确认它是用“导出”生成的 JSON。",
    notBackup: "这不是从本应用导出的文件。现有记录保持不变。",
    imported: "已导入。",
    filePrefix: "还有几次",
    tooLarge: "文件太大，无法保存到此设备。当前记录保持不变。",
    overwritten: (n: number) => `已覆盖 ${n} 条记录。`,
    privacyLink: "隐私说明",
    feedbackTitle: "发送意见",
    feedbackHint: "卡住的地方、奇怪的数字、希望有的功能——什么都可以。会打开邮件应用，发送前可以删改。",
    feedbackSubject: "[还有几次] 意见",
    feedbackQuestions: [
      "1. 看到这些数字时，你想到了什么？",
      "2. 你想把它给谁看吗？给谁？",
      "3. 使用中有卡住或困惑的地方吗？",
      "4. 其他想说的话",
    ],
    clearTitle: "全部删除",
    clearHint: "删除后只能在短时间内撤销，之后就无法恢复。建议先导出。",
    clearConfirm: "确认删除",
    cancel: "取消",
    cleared: "已全部删除。",
    lifeTitle: "预期寿命数据",
    lifeSource: (year: number) =>
      `应用内置了联合国《世界人口展望2024》（World Population Prospects 2024）的分年龄生命表（${year}年）。它按年龄和性别收录了37个国家，所以即使是同一个国家的人，年龄不同得到的数值也不同。与各国官方公布的数据可能有一年以内的差异。`,
    lifeWhy:
      "常说的“平均寿命”是以刚出生的人为准的。已经活到68岁的人，不属于被早逝者拉低的那个平均数，实际上会活得更久。所以直接使用分年龄的表。",
    lifeEditable: "预期寿命随时可以自己修改。",
  },
});

/*
 * 의견이 도착할 곳. 바꾸려면 여기 한 줄만 고치면 된다.
 * 구글 폼 같은 걸 쓰고 싶으면 "https://..." 주소를 그대로 넣으면 된다 — <a>라서
 * mailto든 https든 그대로 동작한다.
 *
 * 주의: 이 값은 앱을 여는 누구에게나 보인다(공개 배포이므로 수집 대상이 된다).
 */
const FEEDBACK_TO = CONTACT_EMAIL;

const NEWLINE = String.fromCharCode(10);

/** 물어볼 것을 미리 채워 둔다. 빈 메일 창을 주면 "잘 썼어요"만 온다. */
function feedbackHref(t: (typeof COPY)["ko"]): string {
  return (
    `mailto:${FEEDBACK_TO}` +
    `?subject=${encodeURIComponent(t.feedbackSubject)}` +
    `&body=${encodeURIComponent(t.feedbackQuestions.flatMap((q) => [q, ""]).join(NEWLINE))}`
  );
}

export default function SettingsPage() {
  const { state, hydrated } = useAppState();
  const { saveSettings, replaceAll, clearAll } = useActions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const t = tr(COPY);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  /*
   * 파일 안에도 내보낸 시각을 적어 둔다. 그래야 나중에 이 파일을 불러와도 "백업 뒤로
   * 바뀐 것 없음"으로 제대로 읽힌다. 앱의 기록에는 내보내기가 끝난 뒤에만 적는다.
   *
   * APK의 WebView는 <a download>를 듣지 않는다(공유 카드와 같은 사정). 그냥 두면
   * 버튼이 아무 일도 안 하는데 백업은 된 것처럼 기록된다 — 가장 나쁜 조합이다.
   */
  async function download(): Promise<void> {
    const at = new Date().toISOString();
    const snapshot = JSON.parse(exportState());
    snapshot.settings.lastBackupAt = at;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    // 오늘은 기기 시간대 기준으로(UTC면 한국 오전 9시 전에 어제 날짜가 붙었다).
    const fileName = `${t.filePrefix}-${todayISO()}.json`;
    if (isNativeApp()) {
      try {
        await shareFileNatively(blob, fileName);
        saveSettings({ lastBackupAt: at });
      } catch {
        setMessage(t.exportFailed);
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    saveSettings({ lastBackupAt: at });
  }

  /*
   * 불러오기는 지금 기록을 통째로 덮어쓴다. 그런데 "전체 삭제"에는 확인과
   * 되돌리기가 있는데 여기에는 없었다 — 더 위험한 쪽에 안전장치가 없는 꼴이었다.
   * 파일을 잘못 고르면 그대로 끝난다. 덮어쓰기 전의 상태를 쥐고 되돌릴 길을 남긴다.
   */
  async function importFile(file: File): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setMessage(t.readFailed);
      return;
    }
    if (!looksLikeBackup(parsed)) {
      setMessage(t.notBackup);
      return;
    }
    const before = JSON.parse(exportState());
    const had = state.people.length + state.moments.length;
    if (!replaceAll(parsed)) {
      // 화면에만 들어가고 저장은 안 된 상태로 두면 "불러왔습니다"가 거짓말이 된다.
      replaceAll(before);
      setMessage(t.tooLarge);
      return;
    }
    setMessage(t.imported);
    // 인연·순간이 없어도 내 정보나 결혼 계획은 덮어써진다. 뭐든 있었으면 되돌릴 길을 남긴다.
    if (had > 0 || state.profile || state.marriage) {
      offerUndo(t.overwritten(had), () => replaceAll(before));
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
      {/* 서로 비슷한 것끼리 묶는다: 보기 · 기록 · 앱. 카드 아홉 장이 줄줄이 서 있으면 찾기 어렵다. */}
      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold tracking-[0.1em] text-ink-600">{t.groupView}</h2>
        <div className="card divide-y divide-ink-200/70 py-1">
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.languageTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.languageHint}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.languageTitle}>
          {[{ value: undefined, label: t.languageAuto }, ...LANGS].map((option) => (
            <button
              key={option.value ?? "auto"}
              type="button"
              lang={option.value}
              aria-pressed={state.settings.language === option.value}
              className={`chip ${state.settings.language === option.value ? "chip-active" : ""}`}
              onClick={() => saveSettings({ language: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.toneTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.toneHint}</p>
        </div>
        <div className="space-y-2">
          {TONE_ORDER.map((tone) => {
            const copy = copyFor(tone);
            const active = state.settings.tone === tone;
            return (
              <button
                key={tone}
                type="button"
                aria-pressed={active}
                onClick={() => saveSettings({ tone })}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  active ? "border-ink-800 bg-ink-800 text-onInk" : "border-ink-200 hover:border-ink-400"
                }`}
              >
                <span className="block text-sm font-medium">{copy.label}</span>
                <span className={`block text-xs ${active ? "text-onInk/70" : "text-ink-400"}`}>
                  {copy.description}
                </span>
                <span className={`mt-2 block text-xs ${active ? "text-onInk/90" : "text-ink-600"}`}>
                  &ldquo;{copy.meetingSentence(t.sampleName, "240")}&rdquo;
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.pastTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">{t.pastHint}</p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label={t.pastTitle}>
          {[
            { on: true, label: t.show },
            { on: false, label: t.hide },
          ].map((option) => (
            <button
              key={String(option.on)}
              type="button"
              aria-pressed={state.settings.showPast === option.on}
              className={`chip ${state.settings.showPast === option.on ? "chip-active" : ""}`}
              onClick={() => saveSettings({ showPast: option.on })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.themeTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.themeHint}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              aria-pressed={state.settings.theme === theme}
              className={`chip ${state.settings.theme === theme ? "chip-active" : ""}`}
              onClick={() => saveSettings({ theme })}
            >
              {t.themes[theme]}
            </button>
          ))}
        </div>
      </section>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold tracking-[0.1em] text-ink-600">{t.groupData}</h2>
        <div className="card divide-y divide-ink-200/70 py-1">
      <section id="backup" className="scroll-mt-4 space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.dataTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.dataHint}</p>
          <p className="mt-1 text-xs text-ink-600">
            {state.settings.lastBackupAt
              ? t.lastBackup(new Date(state.settings.lastBackupAt).toLocaleDateString(locale()))
              : t.neverBackedUp}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-ink-200/70 px-3 py-2">
            <p className="numeral text-lg text-ink-800">{state.people.length}</p>
            <p className="text-[11px] text-ink-400">{t.people}</p>
          </div>
          <div className="rounded-xl border border-ink-200/70 px-3 py-2">
            <p className="numeral text-lg text-ink-800">{state.moments.length}</p>
            <p className="text-[11px] text-ink-400">{t.moments}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => void download()}>
            {t.export}
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            {t.import}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="text-xs text-ink-600">{message}</p>}
      </section>
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.clearTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.clearHint}</p>
        </div>
        {confirmingClear ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                // 되돌릴 수 없다고 적어 뒀지만, 잠깐이라도 기회를 남기는 편이 낫다.
                const snapshot = JSON.parse(exportState());
                clearAll();
                setConfirmingClear(false);
                setMessage(null);
                offerUndo(t.cleared, () => replaceAll(snapshot));
              }}
            >
              {t.clearConfirm}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setConfirmingClear(false)}>
              {t.cancel}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirmingClear(true)}>
            {t.clearTitle}
          </button>
        )}
      </section>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold tracking-[0.1em] text-ink-600">{t.groupApp}</h2>
        <div className="card divide-y divide-ink-200/70 py-1">
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.installTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">{t.installHint}</p>
        </div>
        <InstallButton />
      </section>
      <section className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">{t.feedbackTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">{t.feedbackHint}</p>
        </div>
        <a className="btn-secondary w-fit" href={feedbackHref(t)}>
          {t.feedbackTitle}
        </a>
      </section>
        <Link href="/privacy" className="btn-secondary my-4 w-full">
        {t.privacyLink}
      </Link>
      <section className="space-y-2 py-4">
        <p className="text-sm font-semibold text-ink-800">{t.lifeTitle}</p>
        <p className="text-xs leading-relaxed text-ink-400">{t.lifeSource(LIFE_TABLE_YEAR)}</p>
        <p className="text-xs leading-relaxed text-ink-400">{t.lifeWhy}</p>
        <p className="text-xs leading-relaxed text-ink-400">{t.lifeEditable}</p>
      </section>
        </div>
      </div>
    </div>
  );
}
