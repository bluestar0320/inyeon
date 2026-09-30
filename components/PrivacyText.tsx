"use client";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 개인정보 안내(약관). 저장 단추 아래의 「약관 보기」가 여는 /privacy에 쓴다.
 * 실제 동작과 한 글자도 어긋나면 안 된다.
 */
const COPY = defineCopy<{ title: string; body: string }[]>({
  ko: [
    { title: "무엇을 적나요", body: "내 생년월일·성별·국가·생활 습관, 등록한 사람의 이름·관계·나이·만남 빈도, 그리고 직접 적은 메모·순간 제목·시작일입니다." },
    { title: "어디에 두나요", body: "이 기기 안에만 저장합니다. 서버도 계정도 없어서 운영자를 포함한 누구도 볼 수 없습니다." },
    { title: "어디에 쓰나요", body: "남은 횟수를 계산하는 데만 씁니다. 광고·분석·제3자 제공에는 쓰지 않습니다." },
    { title: "어떻게 지우나요", body: "설정 → 전체 삭제를 누르면 즉시 사라집니다. 설치한 앱(APK)은 앱을 지워도 사라지고, 웹에서는 브라우저의 사이트 데이터 삭제로도 지워집니다." },
    { title: "다른 사람의 정보", body: "인연으로 적는 정보는 본인만 보는 개인 메모로만 써 주세요." },
    { title: "예외", body: "'의견 보내기'는 내 메일 앱으로, 공유·내보내기는 내가 고른 앱이나 파일로 직접 보내는 것입니다. 내가 누르지 않으면 아무것도 나가지 않습니다. 웹으로 쓸 때는 호스팅(GitHub Pages)이 일반적인 접속 기록(IP 주소 등)을 남깁니다." },
  ],
  en: [
    { title: "What you enter", body: "Your birth date, sex, country and lifestyle; the name, relationship, age and meeting frequency of people you add; and any notes, moment titles and start dates you type." },
    { title: "Where it is kept", body: "Only on this device. There is no server and no account, so no one — including us — can see it." },
    { title: "What it is used for", body: "Only to calculate how many times are left. Never for ads, analytics or sharing with third parties." },
    { title: "How to delete it", body: "Settings → Delete everything removes it immediately. Uninstalling the Android app also removes it; on the web, clearing the site's data in your browser does too." },
    { title: "Other people's information", body: "Please use what you enter about others only as a private note for yourself." },
    { title: "Exceptions", body: "'Send feedback' opens your own mail app, and Share or Export send only to the app or file you choose. Nothing leaves unless you tap it. When used on the web, the host (GitHub Pages) keeps ordinary access logs such as IP addresses." },
  ],
  ja: [
    { title: "入力するもの", body: "あなたの生年月日・性別・国・生活習慣、登録した人の名前・関係・年齢・会う頻度、そして自分で書いたメモ・ひとときの名前・開始日です。" },
    { title: "保存場所", body: "この端末の中だけに保存します。サーバーもアカウントもないため、運営者を含め誰も見ることはできません。" },
    { title: "使いみち", body: "残りの回数を計算するためだけに使います。広告・分析・第三者提供には使いません。" },
    { title: "消し方", body: "設定 → すべて削除ですぐに消えます。インストールしたアプリ(APK)はアプリの削除でも消え、ウェブではブラウザのサイトデータ削除でも消えます。" },
    { title: "ほかの人の情報", body: "大切な人として入力する情報は、自分だけが見る個人的なメモとしてお使いください。" },
    { title: "例外", body: "「ご意見を送る」はご自身のメールアプリから、共有・書き出しは自分で選んだアプリやファイルへ直接送ります。自分で押さない限り、何も外に出ません。ウェブで使う場合、ホスティング(GitHub Pages)が一般的なアクセス記録(IPアドレスなど)を残します。" },
  ],
  es: [
    { title: "Qué escribes", body: "Tu fecha de nacimiento, sexo, país y hábitos; el nombre, la relación, la edad y la frecuencia de encuentro de las personas que añades; y las notas, títulos de momentos y fechas de inicio que escribas." },
    { title: "Dónde se guarda", body: "Solo en este dispositivo. No hay servidor ni cuenta, así que nadie —ni siquiera nosotros— puede verlo." },
    { title: "Para qué se usa", body: "Solo para calcular cuántas veces quedan. Nunca para publicidad, analítica ni cesión a terceros." },
    { title: "Cómo borrarlo", body: "Ajustes → Borrar todo lo elimina al instante. Desinstalar la app de Android también lo borra; en la web, también al borrar los datos del sitio en tu navegador." },
    { title: "Datos de otras personas", body: "Usa lo que escribas sobre otras personas solo como una nota privada para ti." },
    { title: "Excepciones", body: "'Enviar comentarios' abre tu propia app de correo, y Compartir o Exportar envían solo a la app o archivo que elijas. No sale nada si tú no lo pulsas. En la web, el alojamiento (GitHub Pages) guarda registros de acceso habituales, como la dirección IP." },
  ],
  zh: [
    { title: "填写的内容", body: "你的出生日期、性别、国家和生活习惯，你添加的人的姓名、关系、年龄和见面频率，以及你亲自填写的备注、时光名称和开始日期。" },
    { title: "保存在哪里", body: "只保存在这台设备上。没有服务器也没有账号，包括运营者在内任何人都看不到。" },
    { title: "用来做什么", body: "只用于计算剩下的次数。绝不用于广告、分析或提供给第三方。" },
    { title: "如何删除", body: "设置 → 全部删除会立即清除。卸载安卓应用(APK)也会清除；在网页上，清除浏览器中的网站数据也会清除。" },
    { title: "他人的信息", body: "你填写的关于他人的信息，请只作为自己看的私人备忘。" },
    { title: "例外", body: "「发送意见」会直接打开你自己的邮件应用，分享和导出只会发送到你选择的应用或文件。你不点，什么都不会发出。在网页上使用时，托管方(GitHub Pages)会留下一般访问记录(如 IP 地址)。" },
  ],
});

export default function PrivacyText() {
  return (
    <dl className="space-y-4">
      {tr(COPY).map((item) => (
        <div key={item.title}>
          <dt className="text-sm font-semibold text-ink-800">{item.title}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink-600">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}
