/*
 * out/ 을 그대로 내주는 작은 정적 서버.
 *
 * `next start`는 정적 내보내기와 함께 쓸 수 없고, 실제 배포도 정적 호스팅이다.
 * 테스트가 배포와 다른 방식으로 뜨면 테스트의 의미가 줄어드므로, 내보낸 파일을
 * 그대로 서빙한다. 의존성은 쓰지 않는다.
 *
 *   node scripts/serve-static.mjs [포트]
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(process.argv[3] ?? "out");
const PORT = Number(process.argv[2] ?? 3123);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

async function resolveFile(pathname) {
  // 경로 탈출 방지. 테스트용이라도 ../ 로 밖을 읽게 두지 않는다.
  const wanted = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(ROOT, wanted);
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;

  for (const path of [candidate, join(candidate, "index.html"), `${candidate}.html`]) {
    try {
      const info = await stat(path);
      if (info.isFile()) return path;
    } catch {
      // 다음 후보로.
    }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const file = (await resolveFile(pathname)) ?? (await resolveFile("/404.html"));

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("없음");
    return;
  }

  res.writeHead(file.endsWith("404.html") ? 404 : 200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    // 서비스 워커가 옛 파일을 붙들지 않도록 테스트 서버에서는 캐시를 끈다.
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`정적 서버: http://localhost:${PORT}  (${ROOT})`);
});
