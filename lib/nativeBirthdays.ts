"use client";

import { birthdayLine, nextBirthday } from "./birthdays";
import { defineCopy, tr } from "./i18n";
import { isNativeApp } from "./nativeShare";
import type { Person } from "./types";

/*
 * APK에서만 생일 알림(7일 전·당일 오전 9시)과 한 달에 한 번 백업 알림을 기기에 맡겨 둔다. 서버는 없다 — 시간이
 * 되면 안드로이드가 직접 띄운다. 웹 번들에는 영향을 주지 않는다(nativeStatusBar와 같은
 * 방식: 네이티브일 때만 이 모듈과 플러그인을 늦게 부른다).
 *
 * 이 앱이 거는 알림은 이 둘뿐이라, 다시 걸 때는 걸려 있던 것을 모두 지우고 처음부터 건다.
 * id를 맞춰 둘 필요가 없다.
 */

const NOTIFY_HOUR = 9;
const BEFORE_DAYS = [7, 0];
const DAY = 86_400_000;

/** 설정에서 켤 때 부른다. 허락하면 true. */
export async function askBirthdayPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  } catch {
    return false;
  }
}

const BACKUP_COPY = defineCopy({
  ko: "지난 백업 뒤로 바뀐 기록이 있어요. 휴대폰에 한 부 저장해 두세요.",
  en: "Some records have changed since your last backup. Save a copy to your phone.",
  ja: "前回のバックアップから記録が変わっています。端末に一部保存しておきましょう。",
  es: "Hay registros nuevos desde tu última copia. Guarda una en tu teléfono.",
  zh: "上次备份后记录有了变化，在手机里存一份吧。",
});

/** 생일 알림에 더해, 백업할 때가 되면(lib/backup.ts backupReminderAt) 한 달에 한 번 한 줄. */
export async function syncBirthdayNotifications(
  people: Person[],
  enabled: boolean,
  backupAt: Date | null,
  now: Date = new Date(),
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
    }
    if (!enabled) return;
    const notifications = [];
    for (const person of people) {
      const next = nextBirthday(person.birthDate, now);
      if (!next) continue;
      // 다음 생일과 그다음 해까지 건다. 앱을 한동안 안 열어도 한 해는 챙긴다.
      // ponytail: 두 해 뒤는 앱을 다시 열 때 다시 건다. 한 해 넘게 안 열면 빠진다.
      const after = nextBirthday(person.birthDate, new Date(next.date.getTime() + DAY));
      for (const birthday of [next.date, after?.date]) {
        if (!birthday) continue;
        for (const before of BEFORE_DAYS) {
          const fire = new Date(birthday.getFullYear(), birthday.getMonth(), birthday.getDate() - before, NOTIFY_HOUR);
          if (fire <= now) continue;
          notifications.push({
            id: notifications.length + 1,
            title: birthdayLine(person, before),
            body: "",
            schedule: { at: fire, allowWhileIdle: true },
            // 정확한 알람 권한을 달라고 설정 화면을 띄우지 않는다. 몇 분 늦어도 괜찮다.
            isExactNotification: false,
            extra: { personId: person.id },
          });
        }
      }
    }
    if (backupAt) {
      notifications.push({
        id: notifications.length + 1,
        title: tr(BACKUP_COPY),
        body: "",
        schedule: { at: backupAt, allowWhileIdle: true },
        isExactNotification: false,
        extra: { backup: true },
      });
    }
    if (notifications.length === 0) return;
    // 알림은 기본으로 켜져 있다. 걸 생일이 생겼을 때 한 번 묻고, 거절했으면(denied) 다시 조르지 않는다.
    // 백업 알림만 있을 때는 묻지 않는다. 첫 인연을 저장하자마자 팝업이 뜨고, 거기서 거절하면 생일 알림까지 영영 꺼진다.
    const hasBirthday = notifications.some((n) => n.extra?.personId);
    let { display } = await LocalNotifications.checkPermissions();
    if (display.startsWith("prompt") && hasBirthday) ({ display } = await LocalNotifications.requestPermissions());
    if (display === "granted") await LocalNotifications.schedule({ notifications });
  } catch {
    // 플러그인이 없거나 기기가 안 받아 주면 그냥 둔다. 앱은 그대로 동작해야 한다.
  }
}
