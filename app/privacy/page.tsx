"use client";

import DocPage from "@/components/DocPage";
import PrivacyText from "@/components/PrivacyText";
import { CONTACT_EMAIL } from "@/lib/contact";
import { defineCopy, getLang, tr } from "@/lib/i18n";

const TITLE = defineCopy({ ko: "개인정보처리방침", en: "Privacy", ja: "個人情報について", es: "Privacidad", zh: "隐私说明" });

/*
 * 개인정보처리방침. 저장 단추 아래 「약관 보기」가 여기로 온다.
 * 이 앱은 서버도 계정도 없다 — 그 사실을 그대로 적는다. 동작과 한 글자도 어긋나면 안 된다.
 * 한국어가 아닌 사람에게는 같은 내용을 줄인 번역(PrivacyText)을 보여 준다.
 */
const SECTIONS = [
  {
    title: "처리하는 정보",
    body: "내 생년월일(또는 나이)·성별·국가·생활 습관, 등록한 사람의 이름·관계·나이·만나는 빈도, 순간의 이름과 빈도, 직접 적은 시작일과 조건입니다.",
  },
  {
    title: "처리 목적",
    body: "남은 시간과 만남을 횟수로 계산하는 데만 씁니다. 광고, 분석, 맞춤형 추천에는 쓰지 않습니다.",
  },
  {
    title: "보관 장소와 기간",
    body: "모든 기록은 이 기기의 브라우저 저장소(설치한 앱은 앱 저장소)에만 보관됩니다. 서버와 계정이 없어 운영자를 포함한 누구도 볼 수 없습니다. 이용자가 지울 때까지 보관됩니다.",
  },
  {
    title: "제3자 제공",
    body: "기록을 누구에게도 제공하거나 판매하지 않습니다. 애초에 기기 밖으로 보내지 않습니다.",
  },
  {
    title: "외부 서비스",
    body: [
      "웹사이트는 GitHub Pages로 제공됩니다. 페이지를 불러올 때 호스팅 제공자가 일반적인 접속 기록(IP 주소, 브라우저 정보 등)을 남길 수 있으며, 이는 해당 제공자의 정책을 따릅니다.",
      "「의견 보내기」는 내 메일 앱을, 「공유」와 「내보내기」는 내가 고른 앱이나 파일을 통해 직접 보내는 것입니다. 내가 누르지 않으면 아무것도 나가지 않습니다.",
    ],
  },
  {
    title: "쿠키 및 분석 도구",
    body: "쿠키, 광고, 방문 분석 도구를 쓰지 않습니다.",
  },
  {
    title: "이용자의 권리",
    body: "설정의 「전체 삭제」로 모든 기록을 즉시 지울 수 있고, 「내보내기」로 기록 전체를 파일로 받을 수 있습니다. 설치한 앱은 앱을 지우면, 웹은 브라우저의 사이트 데이터를 지우면 기록이 사라집니다.",
  },
  {
    title: "아동의 개인정보",
    body: "만 14세 미만이라면 보호자와 함께 이용해 주세요.",
  },
  {
    title: "문의",
    body: `개인정보 관련 문의: ${CONTACT_EMAIL}`,
  },
  {
    title: "처리방침 변경",
    body: "처리 방식이 바뀌면 이 페이지를 고치고 최종 수정일을 바꿉니다.",
  },
];

export default function PrivacyPage() {
  if (getLang() !== "ko") {
    return (
      <DocPage title={tr(TITLE)}>
        <div className="card">
          <PrivacyText />
        </div>
      </DocPage>
    );
  }
  return <DocPage eyebrow="PRIVACY" title="개인정보처리방침" updated="2026.10.01" sections={SECTIONS} />;
}
