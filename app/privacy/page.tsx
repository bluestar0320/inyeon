"use client";

import DocPage, { type DocSection } from "@/components/DocPage";
import { CONTACT_EMAIL } from "@/lib/contact";
import { analyticsEnabled } from "@/lib/analytics";
import { docLang, type DocLang } from "@/lib/docLang";

/*
 * 방문자 집계(lib/analytics.ts)를 켰을 때만 이 문구를 싣는다. 켜지 않았으면 "쓰지 않는다"가 그대로 맞다.
 * 실제로 보내는 것과 한 글자도 어긋나면 안 된다. GoatCounter 쪽 저장 방식은 그쪽 설명이라 그렇게 밝힌다.
 */
const ANALYTICS = analyticsEnabled();
const COUNTING: Record<DocLang, string[]> = {
  ko: [
    "쿠키와 광고는 쓰지 않습니다.",
    "몇 명이 들르는지 알기 위해 GoatCounter(해외 서비스)로 방문 수를 셉니다. 보내는 것은 열린 페이지의 주소(뒷부분 ?id 등은 잘라 냄), 다른 사이트에서 들어왔다면 그 사이트의 도메인, 그리고 '첫 인연 추가·카드 저장·만났어요' 같은 사건의 이름뿐입니다.",
    "입력한 기록(이름·나이·관계·횟수)은 보내지 않습니다. 요청 과정에서 IP 주소와 브라우저 정보가 GoatCounter에 전달됩니다. GoatCounter의 설명에 따르면 IP 주소를 저장하지 않고 개인을 알아보는 쿠키나 기기 식별자를 쓰지 않으며, 브라우저 종류·국가 같은 합계만 남깁니다.",
    "설정의 「방문 수 세기」를 끄면 그 기기에서는 더 이상 보내지 않습니다. 웹에서는 브라우저의 '추적 안 함(Do Not Track·Global Privacy Control)'을 켜도 세지 않습니다.",
  ],
  en: [
    "We use no cookies and no ads.",
    "To know how many people visit, we count visits with GoatCounter (a service based outside Korea). We send only the address of the page opened (with anything after ? or # removed), the domain of the site you came from if it was another site, and the names of events such as “first person added”, “card saved” and “we met”.",
    "Nothing you enter (names, ages, relationships, counts) is sent. Your IP address and browser details reach GoatCounter as part of the request. According to GoatCounter, it does not store IP addresses, uses no identifying cookies or device IDs, and keeps only totals such as browser type and country.",
    "Turn off “Visit counts” in Settings and that device stops sending. On the web, Do Not Track or Global Privacy Control in your browser also stops it.",
  ],
  ja: [
    "Cookieと広告は使いません。",
    "何人が訪れているかを知るため、GoatCounter(海外のサービス)で訪問数を数えます。送るのは、開いたページのアドレス(?や#以降は削除)、ほかのサイトから来た場合はそのドメイン、そして「最初の人を追加・カードを保存・会えました」といった出来事の名前だけです。",
    "入力した記録(名前・年齢・関係・回数)は送りません。リクエストの過程でIPアドレスとブラウザ情報がGoatCounterに伝わります。GoatCounterの説明によると、IPアドレスを保存せず、個人を識別するCookieや端末IDを使わず、ブラウザの種類や国などの合計だけを残します。",
    "設定の「訪問数の集計」をオフにすると、その端末からは送りません。ウェブでは、ブラウザの「トラッキング拒否(Do Not Track・Global Privacy Control)」をオンにしても数えません。",
  ],
};

/* 집계 요청이 해외로 나가므로 국외 이전을 따로 적는다. 운영자·서버 위치는 https://www.goatcounter.com/help/privacy (2026-10 확인). */
const TRANSFER: Record<DocLang, string[]> = {
  ko: [
    "방문 수를 세는 요청은 해외로 전송됩니다.",
    "이전받는 자: GoatCounter(goatcounter.com, 운영자 Martin Tournoij, 아일랜드). 서버는 Hetzner Online GmbH의 핀란드·독일 데이터센터에 있습니다.",
    "이전 항목: IP 주소, 브라우저 정보, 열린 페이지 주소, 들어온 사이트의 도메인, 사건 이름.",
    "이전 시기와 방법: 페이지를 열거나 위 사건이 일어날 때마다 인터넷(HTTPS)으로 보냅니다.",
    "이용 목적과 보유 기간: 방문 수 집계에만 쓰입니다. GoatCounter의 설명에 따르면 IP 주소와 브라우저 정보 원본은 저장되지 않고, 날짜별 합계만 남습니다.",
    "전송을 원하지 않으면 설정의 「방문 수 세기」를 꺼 주세요. 꺼도 모든 기능을 그대로 쓸 수 있습니다.",
  ],
  en: [
    "Visit-count requests are sent outside Korea.",
    "Recipient: GoatCounter (goatcounter.com, operated by Martin Tournoij, Ireland). Its servers are at Hetzner Online GmbH data centers in Finland and Germany.",
    "Items: IP address, browser details, the page address opened, the referring site's domain, and event names.",
    "When and how: each time a page opens or one of those events happens, over the internet (HTTPS).",
    "Purpose and retention: used only to count visits. According to GoatCounter, raw IP addresses and browser details are not stored; only daily totals are kept.",
    "If you don't want this, turn off “Visit counts” in Settings. Every feature still works.",
  ],
  ja: [
    "訪問数を数えるためのリクエストは海外に送られます。",
    "移転先: GoatCounter(goatcounter.com、運営者 Martin Tournoij、アイルランド)。サーバーはHetzner Online GmbHのフィンランド・ドイツのデータセンターにあります。",
    "移転する項目: IPアドレス、ブラウザ情報、開いたページのアドレス、来訪元サイトのドメイン、出来事の名前。",
    "時期と方法: ページを開いたり上の出来事が起きたりするたびに、インターネット(HTTPS)で送ります。",
    "目的と保管期間: 訪問数の集計だけに使われます。GoatCounterの説明によると、IPアドレスとブラウザ情報そのものは保存されず、日ごとの合計だけが残ります。",
    "送信を望まない場合は、設定の「訪問数の集計」をオフにしてください。オフにしてもすべての機能を使えます。",
  ],
};

/*
 * 개인정보처리방침. 저장 단추 아래 확인 체크의 「보기」가 여기로 온다.
 * 이 앱은 서버도 계정도 없다 — 그 사실을 그대로 적는다. 동작과 한 글자도 어긋나면 안 된다.
 * 처리하는 정보는 lib/types.ts의 필드와 맞춘다. 세 언어의 내용은 같아야 한다.
 * 시행일을 바꾸면 components/ConsentCheck.tsx의 POLICY_VERSION도 같이 바꾼다.
 */
const EFFECTIVE = "2026.11.12";

const POLICY: Record<DocLang, { title: string; sections: DocSection[] }> = {
  ko: {
    title: "개인정보처리방침",
    sections: [
      { title: "운영자", body: "「몇번더」는 블루큐 스튜디오(개인 운영)가 만들고 운영합니다." },
      {
        title: "이 기기에만 저장되는 기록",
        body: [
          "내 정보: 생년월일 또는 나이, 성별, 국가, 생활 습관(흡연·음주·운동), 부르는 이름.",
          "등록한 사람: 이름, 부르는 이름, 관계, 생년월일 또는 나이, 성별, 국가, 생활 습관, 만나는 빈도, 만난 날과 한 줄 기억, 자주 하시는 말, 직접 넣은 사진.",
          "순간과 결혼 계획: 이름, 빈도, 목표 나이, 직접 적은 시작일·조건·메모.",
          "생활 습관은 건강에 관한 정보일 수 있습니다. 적지 않아도 모든 기능을 쓸 수 있습니다.",
        ],
      },
      { title: "처리 목적", body: "남은 시간과 만남을 횟수로 계산하고, 적어 둔 기억과 사진을 화면과 카드에 보여 주고, 설치한 앱에서 생일과 백업 때를 알려 드리는 데만 씁니다. 입력한 기록은 광고, 분석, 맞춤형 추천에 쓰지 않습니다." },
      {
        title: "보관 장소와 기간",
        body: [
          "모든 기록은 이 기기에만 보관됩니다. 서버와 계정이 없어 운영자를 포함한 누구도 볼 수 없습니다. 이용자가 지울 때까지 보관됩니다.",
          "기기에 두는 항목: 기록과 설정(브라우저 저장소 relationship-countdown.v1), 직접 넣은 사진(inyeon-photos), 처리방침 확인 시각(inyeon.consent), 방문 수 세기를 끈 표시(inyeon.noCount), 인터넷 없이 화면을 여는 캐시(rc-로 시작). 설치한 앱은 브라우저 저장소가 지워졌을 때 되살리려고 앱 전용 폴더에 기록 사본(records.json)을 하나 더 둡니다.",
        ],
      },
      { title: "제3자 제공", body: "기록을 누구에게도 제공하거나 판매하지 않습니다. 애초에 기기 밖으로 보내지 않습니다." },
      {
        title: "외부 서비스",
        body: [
          "웹사이트는 GitHub Pages로 제공됩니다. 페이지를 불러올 때 호스팅 제공자가 일반적인 접속 기록(IP 주소, 브라우저 정보 등)을 남길 수 있으며, 이는 해당 제공자의 정책을 따릅니다. 설치한 앱은 화면을 앱 안에 품고 있어 GitHub에서 받아 오지 않습니다.",
          "「의견 보내기」는 내 메일 앱을, 「공유」와 「내보내기」·「이미지 저장」은 내가 고른 앱이나 파일을 통해 직접 보내는 것입니다. 내가 누르지 않으면 아무것도 나가지 않습니다.",
        ],
      },
      ANALYTICS ? { title: "쿠키 및 방문자 집계", body: COUNTING.ko } : { title: "쿠키 및 분석 도구", body: "쿠키, 광고, 방문 분석 도구를 쓰지 않습니다." },
      ...(ANALYTICS ? [{ title: "개인정보의 국외 이전", body: TRANSFER.ko }] : []),
      {
        title: "지우기와 이용자의 권리",
        body: [
          "설정의 「전체 삭제」로 사진을 포함한 모든 기록을 바로 지울 수 있고, 「내보내기」로 기록 전체를 파일로 받을 수 있습니다. 설치한 앱은 앱을 지우면, 웹은 브라우저의 사이트 데이터를 지우면 기록이 사라집니다.",
          "내보낸 백업 파일과 저장한 이미지는 휴대폰의 문서/몇번더 폴더나 내가 고른 곳에 남습니다. 앱을 지워도 남으니, 필요 없으면 직접 지워 주세요.",
          `열람·정정·삭제·처리정지를 요청하시려면 ${CONTACT_EMAIL} 로 보내 주세요. 10일 안에 답장 드립니다. 운영자는 위 기록을 갖고 있지 않으므로, 기기에서 직접 지우고 고치는 방법을 안내해 드립니다. 방문 집계는 개인을 알아볼 수 없는 합계라 한 사람 몫만 골라 지울 수 없습니다.`,
        ],
      },
      { title: "안전성 확보조치", body: "기록을 기기 밖으로 보내지 않습니다. 설치한 앱은 기록을 휴대폰의 자동 클라우드 백업과 기기 간 전송에서 빼 둡니다. 웹은 집계 주소 말고는 어디로도 연결하지 못하게 콘텐츠 보안 정책(CSP)을 겁니다. 앱은 운영자만 가진 서명 키로 서명합니다." },
      { title: "아동의 개인정보", body: "이 서비스는 만 14세 미만 아동의 개인정보를 일부러 받지 않습니다. 이용자가 자녀에 관해 적은 기록도 이용자의 기기에만 저장되고 운영자에게 오지 않습니다." },
      { title: "개인정보 보호책임자와 문의", body: `개인정보 보호책임자: 블루큐 스튜디오 운영자. 개인정보와 관련한 문의, 불만, 요청은 ${CONTACT_EMAIL} 로 보내 주세요.` },
      {
        title: "권익침해 구제 방법",
        body: [
          "개인정보 침해로 상담이나 구제가 필요하면 아래 기관에 문의할 수 있습니다.",
          "개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보 분쟁조정위원회(www.kopico.go.kr, 1833-6972), 대검찰청(www.spo.go.kr, 국번 없이 1301), 경찰청(ecrm.police.go.kr, 국번 없이 182).",
        ],
      },
      { title: "처리방침 변경", body: `이 방침은 ${EFFECTIVE}부터 적용합니다. 이전 판(2026.10.30)은 요청하시면 보내 드립니다. 처리 방식이 바뀌면 시행 7일 전에 이 페이지에 알립니다.` },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      { title: "Who runs this", body: "How Many More is made and run by Bluekkyu Studio, an individual developer." },
      {
        title: "Records kept only on this device",
        body: [
          "About you: birth date or age, sex, country, lifestyle (smoking, drinking, exercise), and the name you go by.",
          "People you add: name, nickname, relationship, birth date or age, sex, country, lifestyle, meeting frequency, the days you met and one-line memories, things they often say, and photos you add.",
          "Moments and marriage plan: names, frequency, target age, and any start dates, conditions and notes you enter.",
          "Lifestyle can be health-related. You can use every feature without filling it in.",
        ],
      },
      { title: "Why", body: "Only to count the time and meetings you have left, to show your memories and photos on screen and on cards, and, in the installed app, to remind you of birthdays and backups. What you enter is never used for advertising, analytics or personalized recommendations." },
      {
        title: "Where and how long",
        body: [
          "All records are kept only on this device. There is no server and no account, so no one — including us — can see them. They are kept until you delete them.",
          "What is stored on the device: records and settings (browser storage relationship-countdown.v1), photos you add (inyeon-photos), when you read this policy (inyeon.consent), a mark that visit counts are off (inyeon.noCount), and a cache for opening screens offline (names starting with rc-). The installed app also keeps one copy of your records (records.json) in its own folder, to restore them if browser storage is cleared.",
        ],
      },
      { title: "Sharing with third parties", body: "We never give or sell your records to anyone. They never leave your device in the first place." },
      {
        title: "Outside services",
        body: [
          "The website is served by GitHub Pages. When pages load, the host may keep ordinary access logs (such as IP address and browser details) under its own policy. The installed app carries its screens inside it and does not load them from GitHub.",
          "“Send feedback” goes through your own mail app, and Share, Export and Save image go directly to the app or file you choose. Nothing leaves unless you tap it.",
        ],
      },
      ANALYTICS ? { title: "Cookies and visitor counts", body: COUNTING.en } : { title: "Cookies and analytics", body: "We use no cookies, ads or visitor analytics." },
      ...(ANALYTICS ? [{ title: "Transfers outside Korea", body: TRANSFER.en }] : []),
      {
        title: "Deleting and your rights",
        body: [
          "Delete everything in Settings erases all records, photos included, immediately, and Export gives you all of them as a file. Uninstalling the app, or clearing the site’s data in your browser, also removes them.",
          "Backup files you export and images you save stay in your phone’s Documents/몇번더 folder or wherever you chose. They remain after uninstalling, so delete them yourself if you no longer need them.",
          `To ask to see, correct, delete or stop processing your information, write to ${CONTACT_EMAIL}. We reply within 10 days. We don’t hold the records above, so we’ll show you how to view, change or delete them on your device. Visit counts are anonymous totals, so one person’s share can’t be singled out and deleted.`,
        ],
      },
      { title: "How we keep it safe", body: "Records are never sent off the device. The installed app excludes them from the phone’s automatic cloud backup and device-to-device transfer. The website uses a Content Security Policy so it can connect nowhere except the visit counter. The app is signed with a key only the operator holds." },
      { title: "Children", body: "We do not knowingly collect personal information from children under 14. What you write about your own children also stays only on your device and never reaches us." },
      { title: "Privacy officer and contact", body: `Privacy officer: the operator of Bluekkyu Studio. Send privacy questions, complaints or requests to ${CONTACT_EMAIL}.` },
      {
        title: "Where else to get help",
        body: [
          "If you need advice or a remedy for a privacy problem, you can also contact these Korean bodies.",
          "Personal Information Infringement Report Center (privacy.kisa.or.kr, 118 in Korea), Personal Information Dispute Mediation Committee (www.kopico.go.kr, 1833-6972), Supreme Prosecutors’ Office (www.spo.go.kr, 1301 in Korea), Korean National Police Agency (ecrm.police.go.kr, 182 in Korea).",
        ],
      },
      { title: "Changes to this policy", body: `This policy applies from ${EFFECTIVE}. Ask us and we’ll send the previous version (2026.10.30). If anything changes, we’ll post it on this page 7 days before it takes effect.` },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    sections: [
      { title: "運営者", body: "「あと何回」は、ブルーキュースタジオ(個人運営)が作り、運営しています。" },
      {
        title: "この端末にだけ保存される記録",
        body: [
          "あなたについて: 生年月日または年齢、性別、国、生活習慣(喫煙・飲酒・運動)、呼び名。",
          "登録した人: 名前、呼び名、関係、生年月日または年齢、性別、国、生活習慣、会う頻度、会った日とひとことの思い出、よく言う言葉、自分で入れた写真。",
          "ひとときと結婚の計画: 名前、頻度、目標の年齢、自分で入力した開始日・条件・メモ。",
          "生活習慣は健康に関する情報になりえます。入力しなくてもすべての機能を使えます。",
        ],
      },
      { title: "目的", body: "残りの時間と出会いを回数で計算し、書きとめた思い出や写真を画面とカードに表示し、インストールしたアプリで誕生日とバックアップの時期をお知らせするためだけに使います。入力した記録は広告、分析、おすすめには使いません。" },
      {
        title: "保管場所と期間",
        body: [
          "すべての記録はこの端末だけに保管されます。サーバーもアカウントもないため、運営者を含め誰も見ることはできません。利用者が消すまで保管されます。",
          "端末に置くもの: 記録と設定(ブラウザの保存領域 relationship-countdown.v1)、自分で入れた写真(inyeon-photos)、このポリシーを確認した時刻(inyeon.consent)、訪問数の集計をオフにした印(inyeon.noCount)、オフラインで画面を開くためのキャッシュ(rc-で始まるもの)。インストールしたアプリは、ブラウザの保存領域が消えたときに戻せるよう、アプリ専用フォルダに記録の写し(records.json)をもう一つ置きます。",
        ],
      },
      { title: "第三者への提供", body: "記録を誰かに提供したり販売したりすることはありません。そもそも端末の外に送りません。" },
      {
        title: "外部サービス",
        body: [
          "ウェブサイトはGitHub Pagesで提供しています。ページを読み込むとき、ホスティング事業者が一般的なアクセス記録(IPアドレス、ブラウザ情報など)を残すことがあり、これは事業者のポリシーに従います。インストールしたアプリは画面をアプリの中に持っているため、GitHubから読み込みません。",
          "「ご意見を送る」はご自身のメールアプリから、「共有」「エクスポート」「画像を保存」は自分で選んだアプリやファイルへ直接送るものです。自分で押さない限り、何も外に出ません。",
        ],
      },
      ANALYTICS ? { title: "Cookieと訪問者数の集計", body: COUNTING.ja } : { title: "Cookieと分析ツール", body: "Cookie、広告、アクセス解析ツールは使いません。" },
      ...(ANALYTICS ? [{ title: "個人情報の国外移転", body: TRANSFER.ja }] : []),
      {
        title: "削除と利用者の権利",
        body: [
          "設定の「すべて削除」で写真を含むすべての記録をすぐに消せ、「エクスポート」で記録全体をファイルとして受け取れます。インストールしたアプリはアプリを削除すると、ウェブはブラウザのサイトデータを消すと記録が消えます。",
          "エクスポートしたバックアップファイルと保存した画像は、スマホの書類/몇번더 フォルダや自分で選んだ場所に残ります。アプリを削除しても残るので、不要なら自分で消してください。",
          `開示・訂正・削除・利用停止のご依頼は ${CONTACT_EMAIL} までお送りください。10日以内にお返事します。運営者は上の記録を持っていないため、端末で確認・修正・削除する方法をご案内します。訪問数の集計は個人を特定できない合計なので、一人分だけを選んで消すことはできません。`,
        ],
      },
      { title: "安全管理措置", body: "記録を端末の外に送りません。インストールしたアプリは、記録をスマホの自動クラウドバックアップと端末間の移行から外しています。ウェブは、集計先以外のどこにも接続できないようコンテンツセキュリティポリシー(CSP)をかけています。アプリは運営者だけが持つ署名鍵で署名しています。" },
      { title: "子どもの個人情報", body: "14歳未満の子どもの個人情報を意図して受け取ることはありません。利用者が自分の子どもについて書いた記録も、利用者の端末だけに保存され、運営者には届きません。" },
      { title: "個人情報保護責任者とお問い合わせ", body: `個人情報保護責任者: ブルーキュースタジオの運営者。個人情報に関するお問い合わせ・苦情・ご依頼は ${CONTACT_EMAIL} までお送りください。` },
      {
        title: "権利侵害の救済",
        body: [
          "個人情報の侵害について相談や救済が必要な場合は、次の韓国の機関にも問い合わせできます。",
          "個人情報侵害申告センター(privacy.kisa.or.kr、韓国内118)、個人情報紛争調停委員会(www.kopico.go.kr、1833-6972)、大検察庁(www.spo.go.kr、韓国内1301)、警察庁(ecrm.police.go.kr、韓国内182)。",
        ],
      },
      { title: "ポリシーの変更", body: `このポリシーは${EFFECTIVE}から適用します。以前の版(2026.10.30)はご依頼があればお送りします。取り扱いが変わるときは、施行の7日前にこのページでお知らせします。` },
    ],
  },
};

export default function PrivacyPage() {
  const doc = POLICY[docLang()];
  return <DocPage eyebrow="PRIVACY" title={doc.title} updated={EFFECTIVE} sections={doc.sections} />;
}
