# Play 스토어 등록 자료

Play 콘솔에 그대로 옮겨 붙이면 되는 것들. 스크린샷은 `screens/ko`, `screens/en`(1080×1920).

---

## 1. 앱 이름과 소개

### 한국어

**앱 이름** (30자 이내)

```
몇 번 더 - 남은 만남 세기
```

**간단한 설명** (80자 이내)

```
어머니와 남은 저녁 식사, 몇 번일까요? 만나는 횟수로 세어 보는 남은 시간.
```

**자세한 설명** (4,000자 이내)

```
부모님을 한 달에 한 번 뵌다면, 앞으로 몇 번을 더 뵐 수 있을까요.

세어 보면 생각보다 적습니다. 몇 번 더는 그 숫자를 보여 주는 앱이에요. 내 나이와 상대의 나이, 만나는 빈도를 적으면 남은 만남을 횟수로 셉니다. 겁을 주려는 게 아니라, 다음 약속을 조금 일찍 잡게 하려고 만들었어요.

■ 사람과 순간을 횟수로
어머니, 아버지, 오랜 친구처럼 사람마다 남은 만남을 셉니다. 벚꽃 구경이나 가족 여행처럼 해마다 돌아오는 일도 셀 수 있어요. 해마다 한 번이면 생각보다 금방 끝이 보입니다.

■ 숫자 아래 짧은 편지
숫자만 덩그러니 두지 않고, 그 사람과 지나온 시간과 앞으로의 시간을 짧은 글로 함께 보여 줍니다. 말투는 찡하게, 따뜻하게, 담담하게 중에서 고를 수 있어요.

■ 만났어요, 그리고 한 줄 기억
만난 날 「만났어요」를 누르고 한 줄을 남겨 두면, 한 해가 지나 그 기억들이 그 사람에게 쓰는 편지 한 장으로 모입니다. 자주 하시는 말도 적어 둘 수 있어요.

■ 생신은 잊지 않게
생일을 적어 두면 일주일 전과 당일 아침에 알려 드립니다.

■ 기록은 이 폰 안에만
가입도 로그인도 없습니다. 적은 이름과 기억, 사진은 어디로도 보내지 않아요. 그 대신 폰을 바꾸거나 앱을 지우면 기록도 사라지니, 한 달에 한 번 알려 드릴 때 파일로 받아 두세요.

남은 수명은 국제연합(UN) 세계인구전망 생명표의 통계값으로 어림합니다. 한 사람의 실제 수명을 알려 주지는 않으며, 건강 진단이나 의학적 판단을 대신하지 않습니다.
```

### English

**App name**

```
How Many More - Count Visits
```

**Short description**

```
How many more dinners with Mom? The time you have left, counted in visits.
```

**Full description**

```
If you see your parents once a month, how many more times will you see them?

Fewer than you'd think. How Many More shows you that number. Enter your age, theirs, and how often you meet, and it counts the visits you have left. It isn't meant to scare you. It's meant to nudge you into making the next plan a little sooner.

- People and moments, counted
Count the visits left with Mom, Dad, or an old friend. You can also count things that come around once a year, like cherry blossoms or a family trip.

- A short note under the number
The number never stands alone. A few lines about the time behind you and the time ahead come with it, in a tone you choose: moving, warm, or calm.

- "We met," and a line to remember
Tap "We met" after a visit and leave a line. After a year, those lines come together as a letter to that person.

- Birthdays, remembered
Add a birthday and you'll get a reminder a week before and on the morning of the day.

- Your records stay on this phone
No sign-up, no login. Names, memories and photos are never sent anywhere. That also means they're gone if you switch phones or uninstall, so save a backup file when the monthly reminder comes.

Life expectancy is a statistical estimate from the UN World Population Prospects life tables. It doesn't predict any one person's life and isn't a health assessment or medical advice.
```

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

**지금 상태(APK에서도 집계가 켜져 있음) 그대로 낼 때의 답:**

| 질문 | 답 |
| --- | --- |
| 사용자 데이터를 수집하거나 공유하나요? | 예 |
| 전송 중 암호화되나요? | 예 (https) |
| 사용자가 데이터 삭제를 요청할 수 있나요? | 예. 기록은 설정 → 전체 삭제, 집계는 개인을 식별하지 않아 지울 대상이 없다고 적는다 |
| 수집: 앱 활동 → 앱 상호작용 | 수집함 · 공유 안 함 · 분석 목적 · 선택 불가 |
| 수집: 위치 → 대략적인 위치 | 수집함(나라 단위) · 공유 안 함 · 분석 목적 · 선택 불가 |
| 그 밖의 항목(개인 정보, 사진, 연락처, 기기 ID 등) | 수집 안 함 |

**권하는 쪽: APK에서는 집계를 끈다.** 그러면 모든 항목이 「수집 안 함」이 되고, 스토어 페이지에 「데이터 수집 없음」이라고 뜬다.
설치 수·유지율은 Play 콘솔이 따로 보여 주므로, 앱 안 집계는 웹에만 있어도 충분하다. (결정 대기)

---

## 4. 앱 콘텐츠 설문

- **콘텐츠 등급(IARC):** 폭력·성·도박·욕설 없음. 담배·술은 「사용자의 생활 습관을 적는 칸」일 뿐 묘사하거나 권하지 않으므로 「아니요」. 예상 등급은 전체이용가.
- **건강 앱 신고:** 의료·건강 관리 기능이 아니다. 생명표 통계로 남은 시간을 어림하는 계산기이고, 화면과 약관에 「건강 진단이 아니다」라고 적혀 있다.
- **광고 ID:** 쓰지 않음.
- **정부 앱·금융 기능·뉴스 앱:** 해당 없음.

---

## 5. 출시 전 체크리스트

- [ ] 실기기: 새 APK를 덮어 설치해도 기록이 남는지, 내보낸 파일을 불러올 수 있는지
- [ ] Play 개발자 계정(등록비 25달러, 신원 확인)
- [ ] 앱 서명: 처음 등록할 때 「내 앱 서명 키 사용」을 고르면 직접 깐 APK 사용자도 Play 업데이트를 받는다
- [ ] 비공개 테스트: 개인 계정은 테스터 12명 이상이 14일 동안 (가입할 때 현재 조건 다시 확인)
- [ ] 동의서·약관 법률 검토
- [ ] Actions의 「APK 만들기」로 AAB 받아 비공개 테스트 트랙에 올리기
- [ ] 정식 출시는 단계적 출시(처음 10%)로
