// Vercel Serverless Function: ElevenLabs Scribe STT 프록시 (raw forward)
// API 키는 Vercel 환경변수 ELEVENLABS_API_KEY 에 저장
// 클라이언트가 multipart/form-data로 직접 전송 → 서버는 그대로 forward

module.exports.config = {
  api: { bodyParser: false }
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST만 허용됩니다" } });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "Vercel 환경변수 ELEVENLABS_API_KEY가 설정되지 않았어요." } });
  }

  try {
    // raw multipart body 그대로 읽기
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    const contentType = req.headers["content-type"] || "multipart/form-data";

    const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": contentType
      },
      body: body
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    console.error("STT proxy error:", err);
    res.status(500).json({ error: { message: "STT 요청 실패: " + (err.message || "알 수 없음") } });
  }
};
