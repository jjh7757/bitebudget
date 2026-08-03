import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { CATEGORIES, categoryStyle } from "@/lib/categories";

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string }>;
}) {
  const { tab, category } = await searchParams;
  const visited = tab !== "want";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("restaurants")
    .select("id, name, category, address, budget, visited, rating")
    .eq("user_id", user.id)
    .eq("visited", visited)
    .order("created_at", { ascending: false });

  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    query = query.eq("category", category);
  }

  const { data: restaurants, error } = await query;

  const tabHref = (t: "want" | "visited") =>
    `/?tab=${t}${category ? `&category=${category}` : ""}`;
  const categoryHref = (c?: string) =>
    `/?tab=${visited ? "visited" : "want"}${c ? `&category=${c}` : ""}`;

  return (
    <div className="flex flex-1 flex-col bg-[#161b16] px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">내 맛집</h1>
            <p className="mt-1 text-sm text-zinc-400">예산 안에서 골라보기</p>
          </div>
          <form action={signOut}>
            <button className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300">
              로그아웃
            </button>
          </form>
        </div>

        <div className="flex rounded-xl bg-black/30 p-1 text-sm font-medium">
          <Link
            href={tabHref("want")}
            className={`flex-1 rounded-lg py-2 text-center transition ${
              !visited ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"
            }`}
          >
            가고 싶은 곳
          </Link>
          <Link
            href={tabHref("visited")}
            className={`flex-1 rounded-lg py-2 text-center transition ${
              visited ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"
            }`}
          >
            다녀온 곳
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href={categoryHref()}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              !category
                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                : "border-white/10 text-zinc-400"
            }`}
          >
            전체
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={categoryHref(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                category === c
                  ? "border-orange-500 bg-orange-500/20 text-orange-300"
                  : "border-white/10 text-zinc-400"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400">
            목록을 불러오지 못했습니다: {error.message}
          </p>
        )}

        {!error && restaurants && restaurants.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            아직 등록된 맛집이 없어요. 오른쪽 아래 + 버튼으로 추가해보세요.
          </p>
        )}

        {!error && restaurants && restaurants.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {(restaurants as Restaurant[]).map((r) => (
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
                  {r.visited && (
                    <span className="rounded-full border border-rose-800/60 bg-rose-900/40 px-2 py-0.5 text-xs font-medium text-rose-300">
                      다녀옴
                    </span>
                  )}
                </div>
                <p className="font-medium text-zinc-50">{r.name}</p>
                {r.visited && (
                  <p className="text-sm text-orange-400">
                    {"★".repeat(r.rating ?? 0)}
                    <span className="text-zinc-600">
                      {"☆".repeat(5 - (r.rating ?? 0))}
                    </span>
                  </p>
                )}
                <p className="text-sm text-zinc-400">
                  ₩{r.budget.toLocaleString("ko-KR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/restaurants/new"
        aria-label="맛집 등록"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-2xl text-white shadow-lg transition hover:bg-orange-500"
      >
        +
      </Link>
    </div>
  );
}
