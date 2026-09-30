/*
 * 서비스 워커가 미리 받을 파일 목록을 out/에서 뽑아 sw.js에 박아 넣는다.
 *
 * 왜 필요한가.
 * 예전에는 화면 경로 12개만 손으로 적어 두고 나머지는 "가 보면 캐시되겠지"에
 * 맡겼다. 그런데 화면 하나가 뜨려면 그 화면의 JS 청크가 있어야 하고, 청크는
 * 온라인에서 그 화면을 실제로 열어 봐야만 받아진다. 결과적으로 오프라인에서는
 * **온라인일 때 가 본 화면만** 제대로 돌았다. 안 가본 화면은 껍데기만 뜨고
 * 버튼이 잠겼다(실제로 /moments/new/에서 계산이 "-"로 나왔다).
 *
 * 전부 합쳐 1.7MB밖에 안 되므로 통째로 받아 둔다. 비행기에서 처음 여는 화면도
 * 그대로 돌아야 이 앱이 하려는 일이 된다.
 *
 * 목록은 배포 위치(BASE_PATH)를 뺀 경로로 적는다. 서비스 워커가 자기 등록 범위에서
 * BASE를 읽어 앞에 붙이므로, /inyeon 같은 하위 경로 배포에서도 그대로 맞는다.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

const OUT = "out";
const MARKER = "/* __PRECACHE__ */";
const VERSION_MARKER = "/* __VERSION__ */";

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

const routes = new Set();
// 캐시 이름. 내용이 하나라도 바뀌면 달라진다.
const hash = createHash("sha256");
for (const file of walk(OUT).sort()) {
  const rel = relative(OUT, file).split(sep).join(posix.sep);
  // 서비스 워커 자신은 캐시하지 않는다. 자기를 캐시하면 새 버전이 안 깔린다.
  if (rel === "sw.js") continue;
  // 순간 사진의 변형(blossom-2.webp …)은 미리 받지 않는다. 한 사람이 보는 건 순간마다 한 장이라,
  // 55장(약 2.5MB)을 첫 방문에 다 받게 할 이유가 없다. 볼 때 받아 두면(런타임 캐시) 오프라인에서도 남는다.
  if (/^photos\/[a-z]+-\d\.webp$/.test(rel)) continue;
  hash.update(rel).update(readFileSync(file));
  // index.html은 경로 자체로 요청된다(trailingSlash: true).
  if (rel === "index.html") routes.add("/");
  else if (rel.endsWith("/index.html")) routes.add(`/${rel.slice(0, -"index.html".length)}`);
  else routes.add(`/${rel}`);
}

const list = [...routes].sort();
const swPath = join(OUT, "sw.js");
const source = readFileSync(swPath, "utf8");
if (!source.includes(MARKER)) {
  throw new Error(`${swPath}에 ${MARKER} 자리표시자가 없다. public/sw.js를 확인할 것.`);
}
const version = JSON.stringify(hash.digest("hex").slice(0, 12));
writeFileSync(
  swPath,
  source.replace(MARKER, JSON.stringify(list, null, 2)).replace(VERSION_MARKER, version),
  "utf8",
);
console.log(`서비스 워커 미리받기 목록: ${list.length}개`);
