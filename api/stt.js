// Vercel Serverless Function: ElevenLabs Scribe STT 프록시 (raw forward)
const { rateLimit } = require("./_gate");

module.exports.config = {
  api: { bodyParser: false },
  maxDuration: 60
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST만 허용됩니다" } });

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

    const contentType = req.headers["content-type"] || "multipart/form-data";
    console.log(`[stt] received ${body.length} bytes (read ${readMs}ms), forwarding to ElevenLabs`);

    const fetchStart = Date.now();
    const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": contentType
      },
      body: body
    });
    const fetchMs = Date.now() - fetchStart;
    const text = await upstream.text();
    console.log(`[stt] upstream status=${upstream.status} (${fetchMs}ms), body=${text.length} chars`);

    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    console.error("[stt] error:", err);
    res.status(500).json({ error: { message: "STT 프록시 실패: " + (err.message || "알 수 없음") } });
  }
};
