// Vercel Serverless Function: ElevenLabs Scribe STT 프록시
// 클라이언트가 raw 오디오 바이트를 octet-stream으로 보내면 여기서 multipart 재구성.
// iOS Safari의 multipart 직렬화 (codecs 파라미터 등) 가 ElevenLabs 앞단 nginx에 거부되는 문제 회피.
const { rateLimit, checkPassword } = require("./_gate");

module.exports.config = {
  api: { bodyParser: false },
  maxDuration: 60
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-password, x-audio-type, x-audio-ext");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST만 허용됩니다" } });

  if (!checkPassword(req).ok) {
    return res.status(401).json({ error: { message: "접근 비밀번호가 올바르지 않아요." } });
  }
  const rl = rateLimit(req, { windowMs: 60_000, max: 6 });
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: { message: `음성 요청이 너무 많아요. ${rl.retryAfter}초 뒤 다시 시도해주세요.` } });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "ELEVENLABS_API_KEY가 Vercel에 설정되지 않았어요." } });
  }

  const startTime = Date.now();
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const readMs = Date.now() - startTime;

    const incomingCT = (req.headers["content-type"] || "").toLowerCase();
    const audioType = (req.headers["x-audio-type"] || "audio/mp4").toString().split(";")[0].trim();
    const audioExt = (req.headers["x-audio-ext"] || "m4a").toString().replace(/[^a-z0-9]/gi, "") || "m4a";

    console.log(`[stt] received ${body.length} bytes (read ${readMs}ms), incomingCT=${incomingCT}, audioType=${audioType}, ext=${audioExt}`);

    if (body.length < 500) {
      return res.status(400).json({ error: { message: `오디오가 너무 작아요 (${body.length} bytes). 더 길게 녹음해주세요.` } });
    }

    // 두 가지 경로 지원:
    // 1) octet-stream → Node에서 fresh multipart 재구성 (iOS Safari 우회용 주 경로)
    // 2) multipart/form-data → 기존 코드 호환 (이미 multipart인 경우 그대로 forward)
    let upstreamRes;
    if (incomingCT.startsWith("multipart/form-data")) {
      console.log("[stt] forwarding as-is (multipart)");
      upstreamRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": incomingCT },
        body: body
      });
    } else {
      // raw octet-stream → Node 표준 multipart 재구성
      const fd = new FormData();
      fd.append("model_id", "scribe_v1");
      fd.append("file", new Blob([body], { type: audioType }), `audio.${audioExt}`);
      console.log(`[stt] rebuilt multipart: file=audio.${audioExt} (${audioType}), body=${body.length}B`);
      upstreamRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": apiKey, "accept": "application/json" },
        body: fd
      });
    }

    const text = await upstreamRes.text();
    console.log(`[stt] upstream status=${upstreamRes.status}, body=${text.length} chars`);
    res.status(upstreamRes.status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    console.error("[stt] error:", err);
    res.status(500).json({ error: { message: "STT 프록시 실패: " + (err.message || "알 수 없음") } });
  }
};
