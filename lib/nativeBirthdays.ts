"use client";

import { birthdayLine, nextBirthday } from "./birthdays";
import { isNativeApp } from "./nativeShare";
import type { Person } from "./types";

/*
 * APK에서만 생일 알림(7일 전·당일 오전 9시)을 기기에 맡겨 둔다. 서버는 없다 — 시간이
 * 되면 안드로이드가 직접 띄운다. 웹 번들에는 영향을 주지 않는다(nativeStatusBar와 같은
 * 방식: 네이티브일 때만 이 모듈과 플러그인을 늦게 부른다).
 *
 * 이 앱이 거는 알림은 생일뿐이라, 다시 걸 때는 걸려 있던 것을 모두 지우고 처음부터 건다.
 * id를 맞춰 둘 필요가 없다.
 */

const NOTIFY_HOUR = 9;
const BEFORE_DAYS = [7, 0];
const DAY = 86_400_000;

/** 설정에서 켤 때만 부른다. 허락하면 true. */
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

export async function syncBirthdayNotifications(people: Person[], enabled: boolean, now: Date = new Date()): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
    }
    if (!enabled) return;
    // 설정에서 이미 허락받았다. 나중에 시스템에서 꺼 버렸으면 여기서 다시 조르지 않는다.
    if ((await LocalNotifications.checkPermissions()).display !== "granted") return;

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
    if (notifications.length > 0) await LocalNotifications.schedule({ notifications });
  } catch {
    // 플러그인이 없거나 기기가 안 받아 주면 그냥 둔다. 앱은 그대로 동작해야 한다.
  }
}
