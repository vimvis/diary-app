// 공유 비밀번호 + 간단한 IP 레이트 리밋
// Vercel 서버리스는 인스턴스가 재활용될 때만 메모리가 유지됨 → 완벽하진 않지만 친구 공유용으론 충분
const buckets = new Map(); // ip -> [timestamps]

function getIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

// 윈도우 기간(ms), 최대 요청 수
function rateLimit(req, { windowMs = 60_000, max = 20 } = {}) {
  const ip = getIp(req);
  const now = Date.now();
  const arr = (buckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return { ok: false, ip, retryAfter: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  arr.push(now);
  buckets.set(ip, arr);
  return { ok: true, ip };
}

// 비밀번호 검사 (header: x-app-password). APP_PASSWORD 미설정이면 통과(개발 편의)
function checkPassword(req) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return { ok: true };
  const got = req.headers["x-app-password"];
  if (got && String(got) === String(expected)) return { ok: true };
  return { ok: false };
}

module.exports = { rateLimit, checkPassword, getIp };
