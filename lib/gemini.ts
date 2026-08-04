const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 15_000;
const MAX_PICKS = 3;

export type GeminiCandidate = {
  id: number;
  name: string;
  category: string;
  address: string;
  budget: number;
  visited: boolean;
  rating: number | null;
  memo: string | null;
  isOwner: boolean;
};

type GeminiPick = { id: number; reason: string };

function buildPrompt(budget: number, candidates: GeminiCandidate[]) {
  const list = candidates
    .map((c) =>
      [
        `id=${c.id}`,
        `이름=${c.name}`,
        `카테고리=${c.category}`,
        `주소=${c.address}`,
        `예산=${c.budget}원`,
        c.visited
          ? `다녀옴, 별점=${c.rating ?? "없음"}`
          : "아직 안 가봄",
        c.memo ? `메모=${c.memo}` : null,
        c.isOwner ? "내가 등록함" : "다른 사용자가 등록함",
      ]
        .filter(Boolean)
        .join(", ")
    )
    .join("\n");

  return `당신은 예산에 맞는 맛집을 추천하는 도우미입니다.
사용자의 오늘 예산은 ${budget}원입니다. 아래 후보 목록 중에서 최대 ${MAX_PICKS}곳을 골라 추천해주세요.

후보 목록:
${list}

규칙:
- 반드시 위 목록에 있는 id만 사용하세요.
- 이미 다녀와서 별점이 좋은 곳과 아직 안 가본 곳을 적절히 섞어서 다양하게 추천하세요.
- 각 추천에는 왜 골랐는지 한국어로 한 문장짜리 짧고 자연스러운 이유를 붙이세요.
- 다른 사용자의 신원을 언급하지 마세요("다른 사용자가 등록함" 정보는 이유 문장에 넣지 않아도 됩니다).`;
}

export async function getGeminiRecommendations(
  budget: number,
  candidates: GeminiCandidate[]
): Promise<GeminiPick[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || candidates.length === 0) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(budget, candidates) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "INTEGER" },
                reason: { type: "STRING" },
              },
              required: ["id", "reason"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") return null;

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;

    const validIds = new Set(candidates.map((c) => c.id));
    const picks = parsed
      .filter(
        (p): p is GeminiPick =>
          p &&
          typeof p.id === "number" &&
          typeof p.reason === "string" &&
          validIds.has(p.id)
      )
      .slice(0, MAX_PICKS);

    return picks.length > 0 ? picks : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
