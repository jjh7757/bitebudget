const ENDPOINT = "https://naverapihub.apigw.ntruss.com/search/v1/local";
const TIMEOUT_MS = 8_000;
const DISPLAY = 5; // Naver local search API caps display at 5

export type NaverPlace = {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  link: string;
};

function stripHtml(text: string) {
  return text
    .replace(/<\/?b>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function searchNaverLocal(location: string): Promise<NaverPlace[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[naver] NAVER_CLIENT_ID/NAVER_CLIENT_SECRET is not set, skipping");
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${ENDPOINT}?query=${encodeURIComponent(`${location} 맛집`)}&display=${DISPLAY}&sort=random`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[naver] request failed", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    return items.map((item: Record<string, string>) => ({
      title: stripHtml(item.title ?? ""),
      category: item.category ?? "",
      address: item.address ?? "",
      roadAddress: item.roadAddress ?? "",
      link: item.link ?? "",
    }));
  } catch (err) {
    console.error("[naver] call threw", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
