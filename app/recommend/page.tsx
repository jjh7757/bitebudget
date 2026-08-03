import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryStyle } from "@/lib/categories";

export const dynamic = "force-dynamic";

type Restaurant = {
  id: number;
  name: string;
  category: string;
  address: string;
  budget: number;
  visited: boolean;
  rating: number | null;
};

type Recommendation = Restaurant & { reason: string };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ budget?: string }>;
}) {
  const { budget } = await searchParams;
  const budgetNum = Number(budget);
  const hasBudget = budget && Number.isFinite(budgetNum) && budgetNum > 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let recommendations: Recommendation[] = [];
  let searched = false;

  if (hasBudget) {
    searched = true;

    const { data: candidates } = await supabase
      .from("restaurants")
      .select("id, name, category, address, budget, visited, rating")
      .eq("user_id", user.id)
      .lte("budget", budgetNum);

    const all = (candidates as Restaurant[] | null) ?? [];
    const visited = all
      .filter((r) => r.visited && r.rating != null)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    const want = shuffle(all.filter((r) => !r.visited));

    const picked: Recommendation[] = [];
    for (const r of visited.slice(0, 2)) {
      picked.push({
        ...r,
        reason: `이미 다녀왔고 별점 ${"★".repeat(r.rating ?? 0)}인 곳이에요`,
      });
    }
    for (const r of want) {
      if (picked.length >= 3) break;
      picked.push({ ...r, reason: "아직 안 가본 곳인데 예산에 딱 맞아요" });
    }

    recommendations = picked;
  }

  return (
    <div className="flex flex-1 flex-col bg-[#161b16] px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← 목록으로
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">예산으로 추천받기</h1>
          <p className="mt-1 text-sm text-zinc-400">
            오늘 쓸 수 있는 예산을 입력하면 그 안에서 갈 곳을 골라드려요
          </p>
        </div>

        <form className="flex gap-2">
          <input
            type="number"
            name="budget"
            min={0}
            step={500}
            defaultValue={hasBudget ? budgetNum : undefined}
            placeholder="예: 15000"
            required
            className="flex-1 rounded-xl border border-white/10 bg-[#1e241e] px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-500"
          >
            추천받기
          </button>
        </form>

        {searched && recommendations.length === 0 && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            이 예산 안에 맞는 맛집이 없어요. 다른 예산으로 시도하거나 맛집을 더
            등록해보세요.
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="flex flex-col gap-3">
            {recommendations.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#1e241e] p-4 transition hover:border-orange-500/40"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryStyle(
                      r.category
                    )}`}
                  >
                    {r.category}
                  </span>
                  <span className="text-sm font-medium text-zinc-300">
                    ₩{r.budget.toLocaleString("ko-KR")}
                  </span>
                </div>
                <p className="font-medium text-zinc-50">{r.name}</p>
                <p className="text-sm text-zinc-400">{r.address}</p>
                <p className="text-sm text-orange-400">{r.reason}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
