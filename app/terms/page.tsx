"use client";

import DocPage, { type DocSection } from "@/components/DocPage";
import { CONTACT_EMAIL } from "@/lib/contact";
import { docLang, type DocLang } from "@/lib/docLang";

/* 이용약관. 이 앱에 맞게 새로 쓴 것이다. 실제 동작과 어긋나는 약속은 적지 않는다. 세 언어의 내용은 같아야 한다. */
const TERMS: Record<DocLang, { title: string; sections: DocSection[] }> = {
  ko: {
    title: "이용약관",
    sections: [
      { title: "서비스의 성격", body: "「몇 번 더」는 나이, 예상 수명, 만나는 빈도를 바탕으로 앞으로 남은 만남과 순간을 횟수로 계산하는 도구입니다. 알림이나 연락 기능은 없습니다." },
      { title: "결과에 대한 안내", body: "예상 수명은 국제연합(UN) 세계인구전망 생명표의 통계값이고, 횟수는 입력한 빈도로 계산한 추정치입니다. 한 사람의 실제 수명이나 미래를 알려 주지 않으며, 의료·재무·법률 판단의 근거로 쓰면 안 됩니다." },
      { title: "이용자의 책임", body: "다른 사람에 관해 적는 정보는 본인만 보는 개인 메모로 써 주세요. 결과 이미지를 공유할 때 다른 사람의 이름이 들어가지 않았는지 확인해 주세요." },
      { title: "기록의 보관", body: "기록은 이 기기 안에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 기록이 사라질 수 있으니, 필요하면 설정의 「내보내기」로 백업해 두세요." },
      { title: "서비스 변경 및 중단", body: "계산 방식, 화면, 통계 자료는 더 나은 서비스를 위해 바뀔 수 있습니다. 필요한 경우 일부 기능이 바뀌거나 중단될 수 있습니다." },
      { title: "사진과 공유 이미지", body: "앱에 들어 있는 사진은 AI로 만든 이미지입니다. 결과 이미지는 개인적으로 공유하는 목적으로 자유롭게 쓸 수 있습니다. 「내 사진으로」로 넣은 사진은 카드를 만드는 데만 쓰이고 저장되지 않습니다." },
      { title: "면책", body: "계산 결과의 정확성이나 특정 효과를 보장하지 않습니다. 이용자의 입력 오류, 기기·브라우저 문제처럼 서비스가 통제하기 어려운 사유로 생긴 문제에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다." },
      { title: "문의", body: `이용과 관련한 문의: ${CONTACT_EMAIL}` },
    ],
  },
  en: {
    title: "Terms of Use",
    sections: [
      { title: "What this service is", body: "“How Many More” counts the meetings and moments you have left, based on age, life expectancy and how often you meet. It sends no notifications and contacts no one." },
      { title: "About the results", body: "Life expectancy comes from the United Nations World Population Prospects life tables, and counts are estimates from the frequency you enter. They do not tell anyone’s actual lifespan or future and must not be used for medical, financial or legal decisions." },
      { title: "Your responsibilities", body: "Use what you write about other people only as a private note for yourself. Before sharing a result image, check whether it shows someone else’s name." },
      { title: "Keeping your records", body: "Your records are stored only on this device. Changing devices or clearing browser data can erase them, so back them up with Export in Settings if needed." },
      { title: "Changes and suspension", body: "The calculation, screens and statistics may change to improve the service. Some features may change or be suspended when necessary." },
      { title: "Photos and shared images", body: "The photos in the app are AI-generated images. You may freely use result images for personal sharing. A photo added with “Use my photo” is used only to draw the card and is not stored." },
      { title: "Disclaimer", body: "We do not guarantee the accuracy of results or any particular effect. To the extent permitted by law, liability may be limited for problems caused by things outside our control, such as input errors or device and browser issues." },
      { title: "Contact", body: `Questions about using the service: ${CONTACT_EMAIL}` },
    ],
  },
  ja: {
    title: "利用規約",
    sections: [
      { title: "サービスの性格", body: "「あと何回」は、年齢・平均余命・会う頻度をもとに、これから残る出会いやひとときを回数で計算する道具です。通知や連絡の機能はありません。" },
      { title: "結果について", body: "平均余命は国際連合(UN)世界人口推計の生命表による統計値で、回数は入力した頻度から計算した推定値です。一人ひとりの実際の寿命や未来を示すものではなく、医療・金融・法律の判断の根拠には使わないでください。" },
      { title: "利用者の責任", body: "ほかの人について書く情報は、自分だけが見る個人的なメモとして使ってください。結果の画像を共有するときは、ほかの人の名前が入っていないか確認してください。" },
      { title: "記録の保管", body: "記録はこの端末の中だけに保存されます。端末を替えたりブラウザのデータを消したりすると記録が消えることがあるので、必要なら設定の「エクスポート」でバックアップしてください。" },
      { title: "サービスの変更・中断", body: "計算方法、画面、統計資料は、よりよいサービスのために変わることがあります。必要な場合、一部の機能が変更・中断されることがあります。" },
      { title: "写真と共有画像", body: "アプリに入っている写真はAIで作った画像です。結果の画像は個人的な共有のために自由に使えます。「自分の写真で」で入れた写真はカードを作るためだけに使われ、保存されません。" },
      { title: "免責", body: "計算結果の正確さや特定の効果を保証しません。入力の誤りや端末・ブラウザの問題など、サービスが管理しにくい理由で生じた問題については、関連法令が認める範囲で責任が制限されることがあります。" },
      { title: "お問い合わせ", body: `ご利用に関するお問い合わせ: ${CONTACT_EMAIL}` },
    ],
  },
};

export default function TermsPage() {
  const doc = TERMS[docLang()];
  return <DocPage eyebrow="TERMS" title={doc.title} updated="2026.10.01" sections={doc.sections} />;
}
