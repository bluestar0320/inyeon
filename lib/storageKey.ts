/**
 * 저장소 키. 일부러 "use client" 없는 모듈에 둔다.
 *
 * store.ts는 클라이언트 모듈이라 서버 컴포넌트(layout.tsx)에서 값을 가져오면
 * undefined가 된다. 테마를 화면 그리기 전에 칠하는 인라인 스크립트가 이 키를 서버에서
 * 문자열로 박아야 해서, 양쪽이 같이 쓸 수 있는 자리가 필요하다.
 */
export const STORAGE_KEY = "relationship-countdown.v1";
