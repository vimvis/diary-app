// Vercel Serverless Function: Anthropic API 프록시
// API 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에 저장

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST만 허용됩니다" } });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: "Vercel 환경변수 ANTHROPIC_API_KEY가 설정되지 않았어요. Vercel 프로젝트 → Settings → Environment Variables 에서 추가 후 Redeploy 해주세요." }
    });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    res.status(500).json({ error: { message: "프록시 요청 실패: " + (err.message || "알 수 없음") } });
  }
};
