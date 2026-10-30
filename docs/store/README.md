# Play 스토어 등록 자료

Play 콘솔에 그대로 옮겨 붙이면 되는 것들. 스크린샷은 `screens/ko`, `screens/en`(1080×1920), 그래픽 이미지는 `feature-ko.jpg`, `feature-en.jpg`(1024×500).

---

## 1. 앱 이름과 소개

2026-10-29 출시 보고서판. 글자 수는 괄호 안(제한 대비). 「이 폰 밖으로 나가지 않아요」는 APK에서 자동 백업을 끈 것(apk.yml)이 전제다.

### Google Play: 한국어

- **제목** (19/30): `몇번더 - 부모님과 남은 만남 세기`
- **짧은 설명** (43/80): `어머니와 남은 저녁 식사, 몇 번일까요? 만나는 횟수로 세어 보는 남은 시간.`
- **자세한 설명** (1,144/4,000):

```
부모님을 한 달에 한 번 뵌다면, 앞으로 몇 번 더 뵐 수 있을까요.

세어 보면 막연하던 시간이 숫자 하나로 또렷해집니다. 몇번더는 그 숫자를 조용히 보여 주는 앱이에요. 당신의 나이와 그분의 나이, 얼마나 자주 만나는지를 적으면 남은 시간을 날짜가 아니라 만남의 횟수로 셉니다. 두 사람 중 누구의 시간이 기준이 되는지도 함께 알려 드려요. 겁을 주려는 게 아니라, 다음 약속을 조금 일찍 잡게 하려고 만들었습니다.

어머니, 아버지, 오랜 친구처럼 사람마다 따로 셀 수 있고, 벚꽃 구경이나 명절에 본가 가는 일처럼 해마다 돌아오는 순간도 셀 수 있어요. 한 해에 몇 번 오지 않아 더 반가운 날들이죠. 해마다 몇 번씩인지 막대로 펼쳐 보여 주니, 숫자가 어디서 나왔는지도 바로 확인할 수 있습니다.

숫자만 덩그러니 두지는 않았어요. 그 사람과 지나온 시간, 앞으로의 시간을 짧은 글로 곁들입니다. 말투는 찡하게, 따뜻하게, 담담하게 중에서 고르면 되고, 문장은 날마다 조금씩 달라져요.

만난 날에는 「만났어요」를 누르고 한 줄을 남겨 두세요. 시장에서 귤 한 봉지 사 주신 일, 옛날 앨범을 같이 넘겨 본 저녁 같은 것들이요. 그렇게 모인 한 해의 기억은 그분께 쓰는 편지 한 장으로 엮여 나옵니다. 자주 하시는 말을 적어 두면 사진 아래에 늘 함께 있고요.

생신이나 생일을 적어 두면 일주일 전과 당일 아침에 알려 드립니다. 숫자와 짧은 글은 카드 한 장으로 저장해 가족에게 보낼 수도 있어요.

가입도 로그인도 없습니다. 적어 둔 이름과 기억, 사진은 이 폰 밖으로 나가지 않아요. 그 대신 폰을 바꾸거나 앱을 지우면 기록도 함께 사라지니, 한 달에 한 번쯤 알려 드릴 때 백업 파일로 받아 두세요. 새 폰에서 그 파일을 불러오면 그대로 이어집니다. 인터넷이 없어도 모든 화면이 열려요. 밖으로 나가는 건 어느 화면이 열렸는지, 어떤 기능을 눌렀는지 하는 이름뿐입니다. 누가 보냈는지는 남기지 않고, 나라와 기기·브라우저 종류 정도만 함께 셉니다.

한국어, 영어, 일본어, 스페인어, 중국어로 쓸 수 있습니다.

남은 수명은 국제연합(UN) 세계인구전망 2024 생명표로 어림하고, 담배·술·운동 습관을 고르면 그만큼 조금 보정합니다. 한 사람의 실제 수명을 알려 주지 않으며, 건강 진단이나 의학적 판단을 대신하지 않습니다.
```

**기존 README에서 바꾼 점**

- 집계 문장을 사실대로 고쳤습니다. 기기·브라우저 종류도 함께 간다는 점을 넣었고, 개인정보처리방침의 `COUNTING` 문장과 데이터 보안 답안도 같은 표현으로 맞춥니다.
- 명절은 한 해에 두 번이라서 「해마다 한 번뿐」을 「한 해에 몇 번 오지 않아」로 바꿨습니다.
- 습관 보정 사실을 넣었습니다.
- 「생각보다 적습니다」와 「끝이 생각보다 가까이」를 뺐습니다.
- 「상대」는 「그분」으로 바꿨습니다.
- 「이 폰 밖으로 나가지 않아요」와 「폰을 바꾸면 사라진다」는 자동 백업을 끈다는 전제(3-2 P0의 1번)에서만 사실입니다. 1.0.0에서 그 수정이 빠지면 이 두 문장도 같이 고칩니다.

### Google Play: English

- **Title** (26/30): `How Many More: Visits Left`
- **Short description** (74/80): `How many more dinners with Mom? The time you have left, counted in visits.`
- **Full description** (2,266/4,000):

```
If you see your parents once a month, how many more times will you see them?

Counted out, that time becomes a number you can actually look at. How Many More quietly shows you that number. Enter your age, theirs, and how often you meet, and it counts the time you have left not in years but in visits. It also tells you whose time sets the limit. It's not meant to scare you, just to nudge you into making the next plan a little sooner.

Count Mom, Dad, or an old friend, each on their own. You can count things that come around every year, too, like cherry blossoms or going home for the holidays, days that feel all the more welcome for coming only a few times a year. A year-by-year chart shows exactly where the number comes from.

The number never stands alone. A few lines about the time behind you and the time ahead come with it, in the tone you choose: clearly, warmly, or plainly. The words change a little from day to day.

On the days you meet, tap "We met" and leave a line. The bag of tangerines she bought you at the market, the evening you looked through old albums together. Those lines gather into a letter to that person, made from the past year of memories. Write down something they always say, and it stays with their photo.

Add a birthday and you'll get a reminder a week before and on the morning of the day. You can save the number and its few lines as a card and send it to your family.

No sign-up, no login. The names, memories and photos you enter never leave your phone. Since nothing is kept anywhere else, your records are gone if you switch phones or uninstall, so save a backup file when the app reminds you, about once a month. Load that file on your new phone and pick up where you left off. Everything works offline. The only thing sent out is which screen was opened or which feature was used. It's counted without recording who you are, along with roughly your country and the kind of device and browser.

Available in English, Korean, Japanese, Spanish and Chinese.

Life expectancy is a statistical estimate from the UN World Population Prospects 2024 life tables, adjusted slightly if you choose smoking, drinking or exercise habits. It doesn't predict any one person's life and isn't a health assessment or medical advice.
```

말투 이름(clearly, warmly, plainly)은 지금 앱(lib/tone.ts)에 있는 영어 라벨 그대로입니다. 라벨을 바꾸면 이 줄도 같이 바꿉니다(7장 확인 필요).

### App Store: 한국어

- **이름** (3/30): `몇번더`
- **부제** (13/30): `부모님과 남은 만남 세기`
- **프로모션 텍스트** (86/170): `어머니와 남은 저녁 식사는 몇 번일까요. 나이와 만나는 빈도만 적으면 남은 시간을 만남의 횟수로 세어 드려요. 가입은 없고, 기록은 이 폰 안에만 둡니다.`
- **설명**: Play 한국어 설명을 그대로 씁니다. 알림 문장, 「인터넷이 없어도」 문장, 「폰을 바꾸면 사라진다」 문장은 iOS 빌드에서 동작을 확인한 뒤에만 남깁니다. iOS의 iCloud 백업 포함 여부에 따라 문장이 달라지기 때문입니다.
- **키워드** (90/100바이트): `남은시간,기대수명,부모님생신,어버이날,만남기록,효도계획,생명표`

### App Store: English

- **Name** (13/30): `How Many More`
- **Subtitle** (30/30): `Count the visits you have left`
- **Promotional text** (165/170): `How many more dinners with Mom? Enter two ages and how often you meet, and see the time you have left counted in visits. No sign-up. Your records stay on your phone.`
- **Description**: Play 영문 설명과 같고, 한국어판과 같은 조건을 따릅니다.
- **Keywords** (86/100바이트): `parents,mom,dad,family,life expectancy,elderly,memories,letter,aging,birthday,reminder`

### 스크린샷 순서

2026-10-30에 다시 찍었다(1080×1920, 한국어 낱말 줄바꿈 고친 뒤). 화면 그대로이고 캡션은 넣지 않았다. 올리는 순서:

| 순서 | 파일 | 보여 주는 것 |
|---|---|---|
| 1 | 1-home | 홈의 폴라로이드와 남은 횟수 |
| 2 | 2-detail | 어머니 화면, 「자주 하시는 말」 |
| 3 | 5-letter | 한 해의 기억으로 엮은 편지 |
| 4 | 3-people | 사람마다 남은 만남 |
| 5 | 4-moments | 해마다 돌아오는 순간(해외여행, 벚꽃) |
| 6 | 6-number-dark | 어두운 화면의 숫자와 이야기(퍼센트 문장은 화면 밖) |

### 그래픽 이미지

`feature-ko.jpg`, `feature-en.jpg`(1024×500). 크림색 바탕에 명조 두 줄과 앱 아이콘. AI로 만든 사진은 상업 이용 조건을 확인하기 전까지 쓰지 않는다.

---

## 2. 기본 정보

| 항목 | 값 |
| --- | --- |
| 카테고리 | 라이프스타일 |
| 연락처 이메일 | bluekkyu.studio@gmail.com |
| 개인정보처리방침 URL | https://bluestar0320.github.io/inyeon/privacy/ |
| 광고 포함 | 아니요 |
| 앱 내 구매 | 없음 |
| 대상 연령 | 18세 이상 (죽음·남은 시간을 다루는 앱이라 아동 대상 정책을 피한다) |

---

## 3. 데이터 보안 양식

앱은 기록(이름·나이·기억·사진)을 기기 밖으로 보내지 않는다. 밖으로 나가는 건 GoatCounter 방문 집계 하나뿐이다(lib/analytics.ts).
화면이 열릴 때마다 주소의 경로(뒤의 ?id=… 는 잘라 냄)와 들어온 사이트의 도메인을 보낸다. 쿠키는 쓰지 않고 IP도 저장하지 않지만, GoatCounter는 IP로 나라를 어림해 통계에 남긴다.

**집계는 켜 둔다(2026-10-28 결정).** 출시 초기에는 어떤 기능이 쓰이는지 아는 게 더 중요하다. 답은 아래대로:

| 질문 | 답 |
| --- | --- |
| 사용자 데이터를 수집하거나 공유하나요? | 예 |
| 전송 중 암호화되나요? | 예 (https) |
| 사용자가 데이터 삭제를 요청할 수 있나요? | 예. 기록은 설정 → 전체 삭제, 집계는 개인을 식별하지 않아 지울 대상이 없다고 적는다 |
| 수집: 앱 활동 → 앱 상호작용 | 수집함 · 공유 안 함 · 분석 목적 · 선택 불가 |
| 수집: 위치 → 대략적인 위치 | 수집함(나라 단위) · 공유 안 함 · 분석 목적 · 선택 불가 |
| 그 밖의 항목(개인 정보, 사진, 연락처, 기기 ID 등) | 수집 안 함 |

나중에 판단이 끝나면 APK에서 집계를 끄고 모든 항목을 「수집 안 함」으로 바꿀 수 있다(스토어에 「데이터 수집 없음」으로 뜬다).

---

## 4. 앱 콘텐츠 설문

- **콘텐츠 등급(IARC):** 폭력·성·도박·욕설 없음. 담배·술은 「사용자의 생활 습관을 적는 칸」일 뿐 묘사하거나 권하지 않으므로 「아니요」. 예상 등급은 전체이용가.
- **건강 앱 신고:** 의료·건강 관리 기능이 아니다. 생명표 통계로 남은 시간을 어림하는 계산기이고, 화면과 약관에 「건강 진단이 아니다」라고 적혀 있다.
- **광고 ID:** 쓰지 않음.
- **정부 앱·금융 기능·뉴스 앱:** 해당 없음.

---

## 5. 출시 전 체크리스트

- [x] 실기기: 새 APK를 덮어 설치해도 기록이 남는지, 내보낸 파일을 불러올 수 있는지(2026-10-28)
- [ ] Play 개발자 계정(등록비 25달러, 신원 확인)
- [ ] 앱 서명: 처음 등록할 때 「내 앱 서명 키 사용」을 고르면 직접 깐 APK 사용자도 Play 업데이트를 받는다
- [ ] 비공개 테스트: 개인 계정은 테스터 12명 이상이 14일 동안 (가입할 때 현재 조건 다시 확인)
- [ ] 동의서·약관 법률 검토
- [ ] Actions의 「APK 만들기」로 AAB 받아 비공개 테스트 트랙에 올리기
- [ ] 정식 출시는 처음부터 100%(사용자가 적을 때 단계적 출시는 얻는 게 없다)
