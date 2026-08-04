import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, categoryStyle } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
  user_id: string;
};

const BUDGET_PRESETS = [10000, 20000, 30000] as const;

function chipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
    active
      ? "border-primary bg-primary-100 text-primary-700"
      : "border-border bg-card text-muted-foreground"
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; maxBudget?: string }>;
}) {
  const { tab, category, maxBudget } = await searchParams;
  const visited = tab !== "want";
  const maxBudgetNum = Number(maxBudget);
  const hasBudgetFilter = maxBudget && Number.isFinite(maxBudgetNum) && maxBudgetNum > 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("restaurants")
    .select("id, name, category, address, budget, visited, rating, user_id")
    .eq("visited", visited)
    .order("created_at", { ascending: false });

  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    query = query.eq("category", category);
  }

  if (hasBudgetFilter) {
    query = query.lte("budget", maxBudgetNum);
  }

  const { data: restaurants, error } = await query;

  const ownerIds = [...new Set((restaurants ?? []).map((r) => r.user_id))];
  const ownerLabel = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ownerIds);
    for (const p of profiles ?? []) ownerLabel.set(p.id, p.email.split("@")[0]);
  }

  const buildHref = (overrides: {
    tab?: "want" | "visited";
    category?: string;
    maxBudget?: number;
  }) => {
    const params = new URLSearchParams();
    params.set("tab", overrides.tab ?? (visited ? "visited" : "want"));
    const nextCategory = "category" in overrides ? overrides.category : category;
    if (nextCategory) params.set("category", nextCategory);
    const nextMaxBudget =
      "maxBudget" in overrides ? overrides.maxBudget : hasBudgetFilter ? maxBudgetNum : undefined;
    if (nextMaxBudget) params.set("maxBudget", String(nextMaxBudget));
    return `/?${params.toString()}`;
  };

  const tabHref = (t: "want" | "visited") => buildHref({ tab: t });
  const categoryHref = (c?: string) => buildHref({ category: c });
  const budgetHref = (b?: number) => buildHref({ maxBudget: b });

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">맛집 목록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          모두가 등록한 맛집, 예산 안에서 골라보기
        </p>
      </div>

      <Link
        href="/recommend"
        className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          예산 입력하면 갈 곳 추천해드려요
        </span>
        <span aria-hidden>→</span>
      </Link>

      <div className="flex rounded-md bg-muted p-1 text-sm font-medium">
        <Link
          href={tabHref("want")}
          className={cn(
            "flex-1 rounded-sm py-2 text-center transition",
            !visited ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
          )}
        >
          가고 싶은 곳
        </Link>
        <Link
          href={tabHref("visited")}
          className={cn(
            "flex-1 rounded-sm py-2 text-center transition",
            visited ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
          )}
        >
          다녀온 곳
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href={categoryHref()} className={chipClass(!category)}>
          전체
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={categoryHref(c)} className={chipClass(category === c)}>
            {c}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href={budgetHref()} className={chipClass(!hasBudgetFilter)}>
          예산 전체
        </Link>
        {BUDGET_PRESETS.map((b) => (
          <Link key={b} href={budgetHref(b)} className={chipClass(maxBudgetNum === b)}>
            {(b / 10000).toLocaleString("ko-KR")}만원 이하
          </Link>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && restaurants && restaurants.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          아직 등록된 맛집이 없어요. 오른쪽 아래 + 버튼으로 추가해보세요.
        </p>
      )}

      {!error && restaurants && restaurants.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {(restaurants as Restaurant[]).map((r) => (
            <Link key={r.id} href={`/restaurants/${r.id}`}>
              <Card className="flex h-full flex-col gap-2 border border-transparent p-4 transition hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <Badge className={categoryStyle(r.category)}>{r.category}</Badge>
                  {r.visited && (
                    <Badge className="border-rose-200 bg-rose-100 text-rose-700">
                      {r.user_id === user.id ? "다녀옴" : "등록자 다녀옴"}
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-foreground">{r.name}</p>
                {r.visited && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < (r.rating ?? 0)
                            ? "fill-primary-500 text-primary-500"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  ₩{r.budget.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.user_id === user.id
                    ? "내가 등록"
                    : `등록자: ${ownerLabel.get(r.user_id) ?? "알 수 없음"}`}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/restaurants/new"
        aria-label="맛집 등록"
        className={cn(buttonVariants({ size: "fab" }), "fixed bottom-24 right-5")}
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
