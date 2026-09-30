/*
 * 폴라로이드에 거는 사진. 사용자 사진은 받지 않고, 앱에 넣어 둔 24장 중에서 고른다.
 * 프리셋 18개(관계 7, 순간 11)에 한 장씩, 그리고 공용 "인생의 순간" 6장.
 * 이모지는 lib/presets.ts의 RELATION_SPECS·MOMENT_SPECS와 같은 값이어야 한다.
 */
export const PHOTOS = [
  { key: "mother", emoji: "🌷" },
  { key: "father", emoji: "🌳" },
  { key: "grandparent", emoji: "🫖" },
  { key: "sibling", emoji: "🧩" },
  { key: "spouse", emoji: "🕊️" },
  { key: "child", emoji: "🧸" },
  { key: "friend", emoji: "🍻" },
  { key: "blossom", emoji: "🌸" },
  { key: "sea", emoji: "🌊" },
  { key: "travel", emoji: "✈️" },
  { key: "hometown", emoji: "🏠" },
  { key: "books", emoji: "📖" },
  { key: "surf", emoji: "🏄" },
  { key: "guitar", emoji: "🎸" },
  { key: "snow", emoji: "❄️" },
  { key: "dog", emoji: "🐕" },
  { key: "swim", emoji: "🏊" },
  { key: "woodwork", emoji: "🪚" },
  { key: "graduation" },
  { key: "sportsday" },
  { key: "firstpay" },
  { key: "bouquet" },
  { key: "moving" },
  { key: "railway" },
] as const satisfies readonly { key: string; emoji?: string }[];

export type PhotoKey = (typeof PHOTOS)[number]["key"];

/*
 * 순간 프리셋은 사진이 6장씩 있다(기본 1장 + "-2"~"-6"). 공유 카드에 들어가는 사진이라
 * 모두가 같은 벚꽃을 올리면 재미가 없다. 어느 장을 쓸지는 id로 정한다 — 사람마다 다르고,
 * 한 사람에게는 늘 같다(앱에서 본 폴라로이드와 저장한 카드가 같아야 한다).
 */
export const MOMENT_PHOTO_KEYS = ["blossom", "sea", "travel", "hometown", "books", "surf", "guitar", "snow", "dog", "swim", "woodwork"];
const VARIANTS = 6;

export const SHARED_PHOTOS: string[] = PHOTOS.filter((p) => !("emoji" in p)).map((p) => p.key);

const KEYS = new Set<string>([
  ...PHOTOS.map((p) => p.key),
  ...MOMENT_PHOTO_KEYS.flatMap((key) => Array.from({ length: VARIANTS - 1 }, (_, i) => `${key}-${i + 2}`)),
]);
const MOMENT_KEYS = new Set(MOMENT_PHOTO_KEYS);
const BY_EMOJI = new Map<string, string>(
  PHOTOS.flatMap((p) => ("emoji" in p ? [[p.emoji as string, p.key] as [string, string]] : [])),
);

/** 같은 id면 늘 같은 수. 사진이 열 때마다 바뀌면 "내 사진"이 되지 못한다. */
function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function photoFor(item: { id: string; emoji?: string; photo?: string }): string {
  if (item.photo && KEYS.has(item.photo)) return item.photo;
  const byEmoji = item.emoji ? BY_EMOJI.get(item.emoji) : undefined;
  if (byEmoji && MOMENT_KEYS.has(byEmoji)) {
    const n = hash(item.id) % VARIANTS;
    return n === 0 ? byEmoji : `${byEmoji}-${n + 1}`;
  }
  if (byEmoji) return byEmoji;
  return SHARED_PHOTOS[hash(item.id) % SHARED_PHOTOS.length];
}

export function photoSrc(key: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/photos/${key}.webp`;
}
