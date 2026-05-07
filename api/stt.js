// Vercel Serverless Function: ElevenLabs Scribe STT 프록시
// API 키는 Vercel 환경변수 ELEVENLABS_API_KEY 에 저장
// 클라이언트에서 base64로 인코딩한 오디오를 받아 ElevenLabs Scribe로 STT

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
    const { audio_base64, mime_type } = req.body || {};
    if (!audio_base64) return res.status(400).json({ error: { message: "audio_base64가 필요합니다" } });

    // base64 → Buffer
    const buffer = Buffer.from(audio_base64, "base64");
    const blob = new Blob([buffer], { type: mime_type || "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("model_id", "scribe_v1");
    form.append("language_code", "kor");

    const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    res.status(500).json({ error: { message: "STT 요청 실패: " + (err.message || "알 수 없음") } });
  }
};
