"use client";

import DocPage, { type DocSection } from "@/components/DocPage";
import { CONTACT_EMAIL } from "@/lib/contact";
import { analyticsEnabled } from "@/lib/analytics";
import { docLang, type DocLang } from "@/lib/docLang";

/*
 * 방문자 집계(lib/analytics.ts)를 켰을 때만 이 문구를 싣는다. 켜지 않았으면 "쓰지 않는다"가 그대로 맞다.
 * 실제로 보내는 것과 한 글자도 어긋나면 안 된다.
 */
const ANALYTICS = analyticsEnabled();
const COUNTING: Record<DocLang, string[]> = {
  ko: [
    "쿠키와 광고는 쓰지 않습니다.",
    "몇 명이 들르는지 알기 위해 GoatCounter(해외 서비스)로 방문 수를 셉니다. 보내는 것은 열린 페이지의 주소(뒷부분 ?id 등은 잘라 냄), 다른 사이트에서 들어왔다면 그 사이트의 도메인, 그리고 '첫 인연 추가·카드 저장·만났어요' 같은 사건의 이름뿐입니다.",
    "입력한 기록(이름·나이·관계·횟수)은 보내지 않습니다. 요청 과정에서 IP 주소와 브라우저 정보가 GoatCounter에 전달되지만, GoatCounter는 IP 주소를 저장하지 않고 개인을 알아보는 쿠키나 기기 식별자를 쓰지 않으며, 브라우저 종류·국가 같은 합계만 남깁니다.",
    "브라우저에서 '추적 안 함(Do Not Track·Global Privacy Control)'을 켜면 세지 않습니다.",
  ],
  en: [
    "We use no cookies and no ads.",
    "To know how many people visit, we count visits with GoatCounter (a service based outside Korea). We send only the address of the page opened (with anything after ? or # removed), the domain of the site you came from if it was another site, and the names of events such as “first person added”, “card saved” and “we met”.",
    "Nothing you enter (names, ages, relationships, counts) is sent. Your IP address and browser details reach GoatCounter as part of the request, but GoatCounter does not store IP addresses, uses no identifying cookies or device IDs, and keeps only totals such as browser type and country.",
    "If you turn on Do Not Track or Global Privacy Control in your browser, you are not counted.",
  ],
  ja: [
    "Cookieと広告は使いません。",
    "何人が訪れているかを知るため、GoatCounter(海外のサービス)で訪問数を数えます。送るのは、開いたページのアドレス(?や#以降は削除)、ほかのサイトから来た場合はそのドメイン、そして「最初の人を追加・カードを保存・会えました」といった出来事の名前だけです。",
    "入力した記録(名前・年齢・関係・回数)は送りません。リクエストの過程でIPアドレスとブラウザ情報がGoatCounterに伝わりますが、GoatCounterはIPアドレスを保存せず、個人を識別するCookieや端末IDを使わず、ブラウザの種類や国などの合計だけを残します。",
    "ブラウザで「トラッキング拒否(Do Not Track・Global Privacy Control)」をオンにすると数えません。",
  ],
};

/* 집계 요청이 해외로 나가므로 국외 이전을 따로 적는다. 운영자·서버 위치는 https://www.goatcounter.com/help/privacy (2026-10 확인). */
const TRANSFER: Record<DocLang, string[]> = {
  ko: [
    "방문 수를 세는 요청은 해외로 전송됩니다.",
    "이전받는 자: GoatCounter(goatcounter.com, 운영자 Martin Tournoij, 아일랜드). 서버는 Hetzner Online GmbH의 핀란드·독일 데이터센터에 있습니다.",
    "이전 항목: IP 주소, 브라우저 정보, 열린 페이지 주소, 들어온 사이트의 도메인, 사건 이름.",
    "이전 시기와 방법: 페이지를 열거나 위 사건이 일어날 때마다 인터넷(HTTPS)으로 보냅니다.",
    "이용 목적과 보유 기간: 방문 수 집계에만 쓰입니다. IP 주소와 브라우저 정보 원본은 저장되지 않고, 날짜별 합계만 남습니다.",
    "전송을 원하지 않으면 브라우저의 '추적 안 함'을 켜 주세요. 집계를 거부해도 앱의 모든 기능을 그대로 쓸 수 있습니다.",
  ],
  en: [
    "Visit-count requests are sent outside Korea.",
    "Recipient: GoatCounter (goatcounter.com, operated by Martin Tournoij, Ireland). Its servers are at Hetzner Online GmbH data centers in Finland and Germany.",
    "Items: IP address, browser details, the page address opened, the referring site's domain, and event names.",
    "When and how: each time a page opens or one of those events happens, over the internet (HTTPS).",
    "Purpose and retention: used only to count visits. Raw IP addresses and browser details are not stored; only daily totals are kept.",
    "If you don't want this, turn on Do Not Track in your browser. Every feature of the app still works.",
  ],
  ja: [
    "訪問数を数えるためのリクエストは海外に送られます。",
    "移転先: GoatCounter(goatcounter.com、運営者 Martin Tournoij、アイルランド)。サーバーはHetzner Online GmbHのフィンランド・ドイツのデータセンターにあります。",
    "移転する項目: IPアドレス、ブラウザ情報、開いたページのアドレス、来訪元サイトのドメイン、出来事の名前。",
    "時期と方法: ページを開いたり上の出来事が起きたりするたびに、インターネット(HTTPS)で送ります。",
    "目的と保管期間: 訪問数の集計だけに使われます。IPアドレスとブラウザ情報そのものは保存されず、日ごとの合計だけが残ります。",
    "送信を望まない場合は、ブラウザの「トラッキング拒否」をオンにしてください。集計を拒否してもアプリのすべての機能を使えます。",
  ],
};

/*
 * 개인정보처리방침. 저장 단추 아래 동의 체크의 「보기」가 여기로 온다.
 * 이 앱은 서버도 계정도 없다 — 그 사실을 그대로 적는다. 동작과 한 글자도 어긋나면 안 된다.
 * 세 언어의 내용은 같아야 한다.
 */
const POLICY: Record<DocLang, { title: string; sections: DocSection[] }> = {
  ko: {
    title: "개인정보처리방침",
    sections: [
      { title: "처리하는 정보", body: "내 생년월일(또는 나이)·성별·국가·생활 습관, 등록한 사람의 이름·부르는 이름·관계·나이나 생일·만나는 빈도, 만난 날과 한 줄 기억, 자주 하시는 말, 직접 넣은 사진, 순간의 이름과 빈도, 직접 적은 시작일·조건·메모입니다." },
      { title: "처리 목적", body: "남은 시간과 만남을 횟수로 계산하고, 적어 둔 기억과 사진을 화면과 카드에 보여 주는 데만 씁니다. 입력한 기록은 광고, 분석, 맞춤형 추천에 쓰지 않습니다." },
      { title: "보관 장소와 기간", body: "모든 기록은 이 기기의 브라우저 저장소(설치한 앱은 앱 저장소)에만 보관됩니다. 서버와 계정이 없어 운영자를 포함한 누구도 볼 수 없습니다. 이용자가 지울 때까지 보관됩니다." },
      { title: "제3자 제공", body: "기록을 누구에게도 제공하거나 판매하지 않습니다. 애초에 기기 밖으로 보내지 않습니다." },
      {
        title: "외부 서비스",
        body: [
          "웹사이트는 GitHub Pages로 제공됩니다. 페이지를 불러올 때 호스팅 제공자가 일반적인 접속 기록(IP 주소, 브라우저 정보 등)을 남길 수 있으며, 이는 해당 제공자의 정책을 따릅니다.",
          "「의견 보내기」는 내 메일 앱을, 「공유」와 「내보내기」는 내가 고른 앱이나 파일을 통해 직접 보내는 것입니다. 내가 누르지 않으면 아무것도 나가지 않습니다.",
        ],
      },
      ANALYTICS ? { title: "쿠키 및 방문자 집계", body: COUNTING.ko } : { title: "쿠키 및 분석 도구", body: "쿠키, 광고, 방문 분석 도구를 쓰지 않습니다." },
      ...(ANALYTICS ? [{ title: "개인정보의 국외 이전", body: TRANSFER.ko }] : []),
      { title: "이용자의 권리", body: "설정의 「전체 삭제」로 모든 기록을 즉시 지울 수 있고, 「내보내기」로 기록 전체를 파일로 받을 수 있습니다. 설치한 앱은 앱을 지우면, 웹은 브라우저의 사이트 데이터를 지우면 기록이 사라집니다." },
      { title: "아동의 개인정보", body: "이 서비스는 성인을 위해 만들었고, 만 14세 미만 아동의 개인정보를 일부러 받지 않습니다." },
      { title: "개인정보 보호책임자와 문의", body: `개인정보 보호책임자는 운영자 본인입니다. 개인정보와 관련한 문의나 요청은 ${CONTACT_EMAIL} 로 보내 주세요.` },
      { title: "처리방침 변경", body: "처리 방식이 바뀌면 이 페이지를 고치고 최종 수정일을 바꿉니다." },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      { title: "What we handle", body: "Your birth date (or age), sex, country and lifestyle; the name, nickname, relationship, age or birthday and meeting frequency of people you add; the days you met and the one-line memories you leave; things they often say; photos you add; the names and frequency of moments; and any start dates, conditions and notes you enter." },
      { title: "Why", body: "Only to count the time and meetings you have left, and to show your memories and photos on screen and on cards. What you enter is never used for advertising, analytics or personalized recommendations." },
      { title: "Where and how long", body: "All records are kept only in this device’s browser storage (or app storage for the installed app). There is no server and no account, so no one — including us — can see them. They are kept until you delete them." },
      { title: "Sharing with third parties", body: "We never give or sell your records to anyone. They never leave your device in the first place." },
      {
        title: "Outside services",
        body: [
          "The website is served by GitHub Pages. When pages load, the host may keep ordinary access logs (such as IP address and browser details) under its own policy.",
          "“Send feedback” goes through your own mail app, and Share and Export go directly to the app or file you choose. Nothing leaves unless you tap it.",
        ],
      },
      ANALYTICS ? { title: "Cookies and visitor counts", body: COUNTING.en } : { title: "Cookies and analytics", body: "We use no cookies, ads or visitor analytics." },
      ...(ANALYTICS ? [{ title: "Transfers outside Korea", body: TRANSFER.en }] : []),
      { title: "Your rights", body: "Delete everything in Settings erases all records immediately, and Export gives you all of them as a file. Uninstalling the app, or clearing the site’s data in your browser, also removes them." },
      { title: "Children", body: "This service is made for adults and does not knowingly collect personal information from children under 14." },
      { title: "Privacy officer and contact", body: `The operator is the person responsible for privacy. Send privacy questions or requests to ${CONTACT_EMAIL}.` },
      { title: "Changes to this policy", body: "If anything changes, we will update this page and its date." },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    sections: [
      { title: "取り扱う情報", body: "あなたの生年月日(または年齢)・性別・国・生活習慣、登録した人の名前・呼び名・関係・年齢または誕生日・会う頻度、会った日とひとことの思い出、よく言う言葉、自分で入れた写真、ひとときの名前と頻度、自分で入力した開始日・条件・メモです。" },
      { title: "目的", body: "残りの時間と出会いを回数で計算し、書きとめた思い出や写真を画面とカードに表示するためだけに使います。入力した記録は広告、分析、おすすめには使いません。" },
      { title: "保管場所と期間", body: "すべての記録はこの端末のブラウザの保存領域(インストールしたアプリはアプリの保存領域)だけに保管されます。サーバーもアカウントもないため、運営者を含め誰も見ることはできません。利用者が消すまで保管されます。" },
      { title: "第三者への提供", body: "記録を誰かに提供したり販売したりすることはありません。そもそも端末の外に送りません。" },
      {
        title: "外部サービス",
        body: [
          "ウェブサイトはGitHub Pagesで提供しています。ページを読み込むとき、ホスティング事業者が一般的なアクセス記録(IPアドレス、ブラウザ情報など)を残すことがあり、これは事業者のポリシーに従います。",
          "「ご意見を送る」はご自身のメールアプリから、「共有」と「エクスポート」は自分で選んだアプリやファイルへ直接送るものです。自分で押さない限り、何も外に出ません。",
        ],
      },
      ANALYTICS ? { title: "Cookieと訪問者数の集計", body: COUNTING.ja } : { title: "Cookieと分析ツール", body: "Cookie、広告、アクセス解析ツールは使いません。" },
      ...(ANALYTICS ? [{ title: "個人情報の国外移転", body: TRANSFER.ja }] : []),
      { title: "利用者の権利", body: "設定の「すべて削除」ですべての記録をすぐに消せ、「エクスポート」で記録全体をファイルとして受け取れます。インストールしたアプリはアプリを削除すると、ウェブはブラウザのサイトデータを消すと記録が消えます。" },
      { title: "子どもの個人情報", body: "このサービスは大人のために作ったもので、14歳未満の子どもの個人情報を意図して受け取ることはありません。" },
      { title: "個人情報保護責任者とお問い合わせ", body: `個人情報保護責任者は運営者本人です。個人情報に関するお問い合わせやご依頼は ${CONTACT_EMAIL} までお送りください。` },
      { title: "ポリシーの変更", body: "取り扱いが変わったときは、このページと最終更新日を改めます。" },
    ],
  },
};

export default function PrivacyPage() {
  const doc = POLICY[docLang()];
  return <DocPage eyebrow="PRIVACY" title={doc.title} updated="2026.10.30" sections={doc.sections} />;
}
