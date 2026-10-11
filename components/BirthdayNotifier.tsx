"use client";

import { useEffect } from "react";

import { getLang } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

/**
 * APK에서 생일 알림을 다시 건다 — 앱을 열 때, 인연의 이름·관계·생년월일이 바뀔 때,
 * 설정에서 알림을 켜고 끌 때. 「만났어요」 같은 다른 저장에는 다시 걸지 않는다.
 * 브라우저에서는 아무것도 하지 않고 모듈도 받지 않는다(ThemeApplier와 같은 방식).
 */
export default function BirthdayNotifier() {
  const { state, hydrated } = useAppState();
  const enabled = state.settings.birthdayNotify === true;
  const key = JSON.stringify([
    enabled,
    getLang(),
    state.people.map((p) => [p.id, p.name, p.relation, p.birthDate]),
  ]);

  useEffect(() => {
    if (!hydrated || window.Capacitor?.isNativePlatform?.() !== true) return;
    void import("@/lib/nativeBirthdays").then((m) => m.syncBirthdayNotifications(state.people, enabled));
    // key가 바뀔 때만 다시 건다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  // 알림을 누르면 그 사람 화면으로.
  useEffect(() => {
    if (window.Capacitor?.isNativePlatform?.() !== true) return undefined;
    let remove: (() => void) | undefined;
    void import("@capacitor/local-notifications").then(async ({ LocalNotifications }) => {
      const handle = await LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
        const id = notification.extra?.personId;
        if (typeof id === "string") window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/people/detail?id=${encodeURIComponent(id)}`;
      });
      remove = () => void handle.remove();
    }).catch(() => undefined);
    return () => remove?.();
  }, []);

  return null;
}
