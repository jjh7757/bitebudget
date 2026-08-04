import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, categoryStyle } from "@/lib/categories";
import { getGeminiLocationRecommendations, getGeminiRecommendations } from "@/lib/gemini";
import { searchNaverLocal, type NaverPlace } from "@/lib/naver";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type Restaurant = {
  id: number;
  name: string;
  category: string;
  address: string;
  budget: number;
  visited: boolean;
  rating: number | null;
  memo: string | null;
  user_id: string;
};

type Recommendation = Restaurant & { reason: string; ownerLabel: string };

type LocationRecommendation = NaverPlace & {
  reason: string;
  estimatedBudget: string;
  categoryLabel: string;
};

function naverCategoryLabel(raw: string): string {
  const found = CATEGORIES.find((c) => raw.includes(c));
  if (found) return found;
  const parts = raw
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "음식점";
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFallbackRecommendations(
  all: Restaurant[],
  currentUserId: string,
  labelFor: (r: Restaurant) => string,
  ownerName: Map<string, string>
): Recommendation[] {
  const visited = all
    .filter((r) => r.visited && r.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const want = shuffle(all.filter((r) => !r.visited));

  const picked: Recommendation[] = [];
  for (const r of visited.slice(0, 2)) {
    const isOwner = r.user_id === currentUserId;
    picked.push({
      ...r,
      ownerLabel: labelFor(r),
      reason: isOwner
        ? `이미 다녀왔고 별점 ${"★".repeat(r.rating ?? 0)}인 곳이에요`
        : `${ownerName.get(r.user_id) ?? "다른 사용자"}님이 다녀왔고 별점 ${"★".repeat(r.rating ?? 0)}인 곳이에요`,
    });
  }
  for (const r of want) {
    if (picked.length >= 3) break;
    const isOwner = r.user_id === currentUserId;
    picked.push({
      ...r,
      ownerLabel: labelFor(r),
      reason: isOwner
        ? "아직 안 가본 곳인데 예산에 딱 맞아요"
        : `${ownerName.get(r.user_id) ?? "다른 사용자"}님의 위시리스트예요, 예산에 딱 맞아요`,
    });
  }

  return picked;
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ budget?: string; location?: string; mode?: string }>;
}) {
  const { budget, location, mode: modeParam } = await searchParams;
  const mode = modeParam === "location" ? "location" : "db";
  const budgetNum = Number(budget);
  const hasBudget = budget && Number.isFinite(budgetNum) && budgetNum > 0;
  const hasLocationQuery = mode === "location" && hasBudget && !!location?.trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let recommendations: Recommendation[] = [];
  let searched = false;

  if (mode === "db" && hasBudget) {
    searched = true;

    const { data: candidates } = await supabase
      .from("restaurants")
      .select("id, name, category, address, budget, visited, rating, memo, user_id")
      .lte("budget", budgetNum);

    const all = (candidates as Restaurant[] | null) ?? [];

    const ownerIds = [...new Set(all.map((r) => r.user_id))];
    const ownerName = new Map<string, string>();
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", ownerIds);
      for (const p of profiles ?? []) ownerName.set(p.id, p.email.split("@")[0]);
    }
    const labelFor = (r: Restaurant) =>
      r.user_id === user.id ? "내가 등록" : `등록자: ${ownerName.get(r.user_id) ?? "알 수 없음"}`;

    const geminiPicks = await getGeminiRecommendations(
      budgetNum,
      all.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        address: r.address,
        budget: r.budget,
        visited: r.visited,
        rating: r.rating,
        memo: r.memo,
        isOwner: r.user_id === user.id,
      }))
    );

    if (geminiPicks) {
      const byId = new Map(all.map((r) => [r.id, r]));
      recommendations = geminiPicks
        .map((pick) => {
          const r = byId.get(pick.id);
          if (!r) return null;
          return { ...r, reason: pick.reason, ownerLabel: labelFor(r) };
        })
        .filter((r): r is Recommendation => r !== null);
    }

    if (recommendations.length === 0) {
      recommendations = buildFallbackRecommendations(all, user.id, labelFor, ownerName);
    }
  }

  let locationRecommendations: LocationRecommendation[] = [];
  let locationSearched = false;
  let locationNoResults = false;

  if (hasLocationQuery) {
    locationSearched = true;
    const trimmedLocation = location!.trim();
    const places = await searchNaverLocal(trimmedLocation);

    if (places.length === 0) {
      locationNoResults = true;
    } else {
      const picks = await getGeminiLocationRecommendations(budgetNum, trimmedLocation, places);

      if (picks) {
        locationRecommendations = picks.map((pick) => ({
          ...places[pick.index],
          reason: pick.reason,
          estimatedBudget: pick.estimatedBudget,
          categoryLabel: naverCategoryLabel(places[pick.index].category),
        }));
      } else {
        locationRecommendations = places.slice(0, 3).map((p) => ({
          ...p,
          reason: "네이버 지역 검색 결과예요 (예산 매칭은 확인되지 않았어요)",
          estimatedBudget: "추정 불가",
          categoryLabel: naverCategoryLabel(p.category),
        }));
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">예산으로 추천받기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "db"
            ? "오늘 쓸 수 있는 예산을 입력하면 그 안에서 갈 곳을 골라드려요"
            : "동네나 역 이름과 예산을 입력하면 주변 맛집을 찾아드려요"}
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <Link
          href="/recommend"
          className={cn(
            "px-3 py-2 text-sm font-medium transition",
            mode === "db"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          내 맛집에서
        </Link>
        <Link
          href="/recommend?mode=location"
          className={cn(
            "px-3 py-2 text-sm font-medium transition",
            mode === "location"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          주변에서 찾기
        </Link>
      </div>

      {mode === "db" ? (
        <>
          <form className="flex gap-2">
            <Input
              type="number"
              name="budget"
              min={0}
              step={500}
              defaultValue={hasBudget ? budgetNum : undefined}
              placeholder="예: 15000"
              required
              className="flex-1"
            />
            <Button type="submit" className="shrink-0">
              추천받기
            </Button>
          </form>

          {searched && recommendations.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              이 예산 안에 맞는 맛집이 없어요. 다른 예산으로 시도하거나 맛집을 더
              등록해보세요.
            </p>
          )}

          {recommendations.length > 0 && (
            <div className="flex flex-col gap-3">
              {recommendations.map((r) => (
                <Link key={r.id} href={`/restaurants/${r.id}`}>
                  <Card className="flex flex-col gap-2 border border-transparent p-4 transition hover:border-primary-200">
                    <div className="flex items-center justify-between">
                      <Badge className={categoryStyle(r.category)}>{r.category}</Badge>
                      <span className="text-sm font-medium text-foreground">
                        ₩{r.budget.toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.address}</p>
                    <p className="text-sm text-primary-600">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">{r.ownerLabel}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <form className="flex flex-col gap-2">
            <input type="hidden" name="mode" value="location" />
            <Input
              type="text"
              name="location"
              defaultValue={location ?? ""}
              placeholder="예: 강남역, 홍대"
              required
            />
            <div className="flex gap-2">
              <Input
                type="number"
                name="budget"
                min={0}
                step={500}
                defaultValue={hasBudget ? budgetNum : undefined}
                placeholder="예: 15000"
                required
                className="flex-1"
              />
              <Button type="submit" className="shrink-0">
                추천받기
              </Button>
            </div>
          </form>

          {locationSearched && locationNoResults && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              이 지역에서 검색 결과를 찾지 못했어요. 다른 동네나 역 이름으로
              시도해보세요.
            </p>
          )}

          {locationRecommendations.length > 0 && (
            <div className="flex flex-col gap-3">
              {locationRecommendations.map((r, i) => (
                <a
                  key={`${r.link}-${i}`}
                  href={r.link || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card className="flex flex-col gap-2 border border-transparent p-4 transition hover:border-primary-200">
                    <div className="flex items-center justify-between">
                      <Badge className={categoryStyle(r.categoryLabel)}>{r.categoryLabel}</Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {r.estimatedBudget}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{r.roadAddress || r.address}</p>
                    <p className="text-sm text-primary-600">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      네이버 지역 검색 결과 · 가격은 추정치예요
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
