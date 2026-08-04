import type { NaverPlace } from "./naver";

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
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set, falling back");
    return null;
  }
  if (candidates.length === 0) return null;

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

    if (!res.ok) {
      console.error("[gemini] request failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error("[gemini] no text in response", JSON.stringify(data));
      return null;
    }

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      console.error("[gemini] response was not an array:", text);
      return null;
    }

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

    if (picks.length === 0) {
      console.error("[gemini] no valid picks in response:", text);
      return null;
    }

    console.log(`[gemini] returned ${picks.length} pick(s)`);
    return picks;
  } catch (err) {
    console.error("[gemini] call threw", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export type LocationPick = { index: number; reason: string; estimatedBudget: string };

function buildLocationPrompt(budget: number, location: string, places: NaverPlace[]) {
  const list = places
    .map(
      (p, i) =>
        `index=${i}, 이름=${p.title}, 카테고리=${p.category || "정보 없음"}, 주소=${p.roadAddress || p.address}`
    )
    .join("\n");

  return `당신은 예산과 위치에 맞는 맛집을 추천하는 도우미입니다.
사용자는 "${location}" 근처에서, 오늘 쓸 수 있는 예산 ${budget}원 안에서 갈 곳을 찾고 있습니다.
아래는 네이버 지역 검색으로 찾은 후보 목록입니다. 가격 정보는 제공되지 않으니, 이름과 카테고리를 참고해 예산에 맞을 만한 곳을 최대 ${MAX_PICKS}곳 골라주세요.

후보 목록:
${list}

규칙:
- 반드시 위 목록에 있는 index만 사용하세요.
- 가격 정보가 없으므로 이름/카테고리로 미루어 예산에 맞을 것 같은 곳을 추정해서 고르세요.
- 각 추천에는 왜 골랐는지 한국어로 한 문장짜리 짧고 자연스러운 이유를 붙이세요.
- estimatedBudget에는 "약 1만원대" 같은 추정 가격대를 한국어로 짧게 적고, 실제 가격이 아닌 추정치임을 알 수 있게 하세요.`;
}

export async function getGeminiLocationRecommendations(
  budget: number,
  location: string,
  places: NaverPlace[]
): Promise<LocationPick[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set, falling back");
    return null;
  }
  if (places.length === 0) return null;

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
        contents: [{ parts: [{ text: buildLocationPrompt(budget, location, places) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                index: { type: "INTEGER" },
                reason: { type: "STRING" },
                estimatedBudget: { type: "STRING" },
              },
              required: ["index", "reason", "estimatedBudget"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[gemini] location request failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error("[gemini] location: no text in response", JSON.stringify(data));
      return null;
    }

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      console.error("[gemini] location: response was not an array:", text);
      return null;
    }

    const picks = parsed
      .filter(
        (p): p is LocationPick =>
          p &&
          typeof p.index === "number" &&
          p.index >= 0 &&
          p.index < places.length &&
          typeof p.reason === "string" &&
          typeof p.estimatedBudget === "string"
      )
      .slice(0, MAX_PICKS);

    if (picks.length === 0) {
      console.error("[gemini] location: no valid picks in response:", text);
      return null;
    }

    console.log(`[gemini] location returned ${picks.length} pick(s)`);
    return picks;
  } catch (err) {
    console.error("[gemini] location call threw", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
