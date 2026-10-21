/*
 * 직접 올린 사진(ownPhoto)은 기록과 따로 IndexedDB에 둔다. localStorage는 보통 5MB라서
 * 사진 열 장 남짓이면 가득 차고, 그 뒤로는 사진이 아닌 기록까지 저장되지 않았다.
 *
 * 키는 인연·순간의 id, 값은 JPEG data URL. 화면은 여전히 메모리 상태의 ownPhoto를 읽고,
 * 저장할 때만 store.ts가 사진을 이리로 빼낸다. IndexedDB를 못 쓰는 환경이면 모든 함수가
 * 실패를 돌려주고, 그때 store.ts는 예전처럼 사진을 기록 안에 넣어 둔다.
 */

const DB_NAME = "inyeon-photos";
const STORE = "photos";

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}

/** 저장된 사진 전부. 못 열면 실패한다(호출하는 쪽이 "IndexedDB 없음"으로 받는다). */
export async function loadPhotos(): Promise<Map<string, string>> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const photos = new Map<string, string>();
    const request = db.transaction(STORE).objectStore(STORE).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve(photos);
      if (typeof cursor.key === "string" && typeof cursor.value === "string") photos.set(cursor.key, cursor.value);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

/** 넣을 것과 지울 것을 한 트랜잭션으로. 끝까지 써져야 성공한다. */
export async function writePhotos(put: Map<string, string>, remove: string[]): Promise<void> {
  if (put.size === 0 && remove.length === 0) return;
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const [id, photo] of put) store.put(photo, id);
    for (const id of remove) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
