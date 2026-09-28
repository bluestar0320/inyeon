import type { AppState } from "./types";

/*
 * 백업을 권할 때인지.
 *
 * 기록은 이 기기 안에만 있다. 앱을 지우거나 브라우저 데이터를 비우면 그대로 사라진다.
 * 알림은 이 앱이 하지 않는 일이라, 홈에 한 줄만 띄운다. 그 한 줄도 조르지 않도록:
 *
 * - 마지막 내보내기 뒤로 바뀐 것이 없으면 띄우지 않는다(이미 안전하다).
 * - 바뀐 것이 있어도 일주일은 기다린다. 처음 온 사람에게 첫날부터 백업하라고 하면
 *   앱이 뭘 하는지 보기도 전에 숙제부터 받는 셈이다.
 *
 * 지운 것은 updatedAt을 남기지 않아 여기서 잡히지 않는다. 지운 기록을 잃을 일은
 * 없으니 괜찮다.
 */
export const BACKUP_GRACE_DAYS = 7;

export function backupDue(state: AppState, now: Date = new Date()): boolean {
  const items = [...state.people, ...state.moments];
  const changes = items.map((item) => item.updatedAt);
  if (state.marriage) changes.push(state.marriage.updatedAt);
  if (changes.length === 0) return false;

  const last = state.settings.lastBackupAt;
  if (last && changes.every((at) => at <= last)) return false;

  // 기다리기 시작한 때: 백업한 적이 있으면 그때부터, 없으면 처음 만든 때부터.
  const since = last ?? items.map((item) => item.createdAt).concat(changes).sort()[0];
  const days = (now.getTime() - new Date(since).getTime()) / 86_400_000;
  return days >= BACKUP_GRACE_DAYS;
}
