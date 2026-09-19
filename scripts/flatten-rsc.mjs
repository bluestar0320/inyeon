/*
 * 내보낸 파일 이름과 브라우저가 요청하는 이름을 맞춘다.
 *
 * Next 16.3.2의 정적 내보내기는 화면 전환용 RSC 데이터를 디렉터리로 쪼개 쓴다.
 *
 *   만들어지는 것:  out/people/__next.people/__PAGE__.txt
 *   요청하는 것:    /people/__next.people.__PAGE__.txt
 *
 * 정적 호스팅은 파일을 이름 그대로 찾으므로 전부 404가 되고, 그러면 링크를 누를
 * 때마다 화면 전체를 새로 받는다(동작은 하지만 느리고 콘솔이 지저분하다).
 *
 * 그래서 같은 내용을 브라우저가 찾는 이름으로도 한 벌 놓아 둔다. 원본은 지우지
 * 않는다 — 다음 버전에서 Next가 스스로 맞추면 이 단계만 지우면 된다.
 *
 * `__next.` 로 시작하는 디렉터리부터 끝까지를 "."으로 이어 붙여 그 위 디렉터리에 쓴다.
 *   people/detail/__next.people/detail/__PAGE__.txt
 *     -> people/detail/__next.people.detail.__PAGE__.txt
 */
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(process.argv[2] ?? "out");

/** __next.* 디렉터리 안에 들어 있는 파일을 전부 찾는다. */
async function collect(dir, chain = null, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const startsHere = chain === null && entry.name.startsWith("__next.");
      if (startsHere) {
        // 이 디렉터리가 평탄화의 시작점. 위 디렉터리에 파일을 쓸 것이다.
        await collect(path, { base: dir, parts: [entry.name] }, out);
      } else if (chain !== null) {
        await collect(path, { ...chain, parts: [...chain.parts, entry.name] }, out);
      } else {
        await collect(path, null, out);
      }
    } else if (chain !== null) {
      out.push({ from: path, to: join(chain.base, [...chain.parts, entry.name].join(".")) });
    }
  }
  return out;
}

try {
  await stat(ROOT);
} catch {
  console.error(`내보낸 폴더가 없습니다: ${ROOT}`);
  process.exit(1);
}

const jobs = await collect(ROOT);
for (const { from, to } of jobs) {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
}
console.log(`RSC 파일 평탄화: ${jobs.length}개`);
