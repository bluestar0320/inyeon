export type Rel = "parent" | "grandparent" | "partner" | "child" | "sibling" | "friend" | "other";


/*
 * 조부모를 먼저 본다 — "할머니"의 "머니", "grandmother"의 "mother"가 부모님으로 잡히지 않게.
 * 라틴 문자 낱말은 낱말 머리에서만 맞춘다("Jason"의 "son", "person"이 자녀가 되지 않게).
 */
const REL_WORDS: [Rel, string[]][] = [
  ["grandparent", ["할머니", "할아버지", "조부모", "외할", "grandma", "grandpa", "grandmother", "grandfather", "grandparent", "祖父", "祖母", "おじいちゃん", "おばあちゃん", "abuel", "爷爷", "奶奶", "外公", "外婆"]],
  ["parent", ["부모", "엄마", "어머니", "아빠", "아버지", "mom", "mother", "dad", "father", "parent", "お母さん", "お父さん", "両親", "母", "父", "mamá", "papá", "madre", "padre", "妈", "爸"]],
  ["partner", ["연인", "애인", "배우자", "남편", "아내", "여자친구", "남자친구", "partner", "wife", "husband", "girlfriend", "boyfriend", "恋人", "妻", "夫", "パートナー", "pareja", "esposa", "esposo", "novia", "novio", "伴侣", "老公", "老婆", "男朋友", "女朋友"]],
  ["child", ["자녀", "아들", "딸", "아이", "child", "son", "daughter", "kid", "子ども", "息子", "娘", "hijo", "hija", "孩子", "儿子", "女儿"]],
  ["sibling", ["형제", "자매", "누나", "오빠", "언니", "동생", "sibling", "brother", "sister", "きょうだい", "兄", "姉", "弟", "妹", "herman", "兄弟", "姐妹", "哥", "姐"]],
  ["friend", ["친구", "friend", "友", "amig", "amistad", "朋友"]],
];

/** 이 말이 들어 있으면 위 낱말이 섞여 있어도 가족 칸에 넣지 않는다(사돈·친척·대부모·모교·사업 동료·손주). */
const NOT_KIN = [
  "시어머니", "시아버지", "장모", "장인", "큰아버지", "큰어머니", "작은아버지", "작은어머니",
  "in-law", "god", "business", "grandson", "granddaughter", "grandchild",
  "叔父", "叔母", "伯父", "伯母", "姑妈", "姑父", "舅妈", "姨妈", "姨父", "母校",
];

/** 지우고 본다 — "아이돌 친구"의 "아이"가 자녀로 잡히지 않게. */
const NOISE = ["아이돌"];

function matches(text: string, word: string): boolean {
  if (!/^[a-z]/.test(word)) return text.includes(word);
  return new RegExp(`(^|[^a-zà-ÿ])${word}`).test(text);
}

export function relationKind(relation: string | undefined): Rel {
  let text = (relation ?? "").trim().toLowerCase();
  if (!text || NOT_KIN.some((w) => text.includes(w))) return "other";
  for (const noise of NOISE) text = text.replaceAll(noise, " ");
  for (const [rel, words] of REL_WORDS) if (words.some((w) => matches(text, w))) return rel;
  return "other";
}

/**
 * 사람의 관계 종류. 관계 칩이 있으면 칩으로 정한다(부모님·조부모님·형제자매).
 * 다른 칩만 있으면 관계 칸 글을 읽고, 못 읽으면 친구로 본다. 칩이 없는 옛 기록만 글로 짐작한다.
 */
export function relOf(person: { relation?: string; bonds?: readonly string[] } | undefined): Rel {
  const bonds = person?.bonds ?? [];
  if (bonds.includes("parent")) return "parent";
  if (bonds.includes("grandparent")) return "grandparent";
  if (bonds.includes("sibling")) return "sibling";
  const text = relationKind(person?.relation);
  return bonds.length && text === "other" ? "friend" : text;
}
