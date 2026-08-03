import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteRestaurant, updateRestaurantStatus } from "@/lib/actions";
import { categoryStyle } from "@/lib/categories";
import RatingInput from "@/components/RatingInput";

export const dynamic = "force-dynamic";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) notFound();

  const updateAction = updateRestaurantStatus.bind(null, restaurant.id);
  const deleteAction = deleteRestaurant.bind(null, restaurant.id);

  return (
    <div className="flex flex-1 flex-col bg-[#161b16] px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← 목록으로
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#1e241e] p-6">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${categoryStyle(
              restaurant.category
            )}`}
          >
            {restaurant.category}
          </span>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-50">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{restaurant.address}</p>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-zinc-400">예산</span>
            <span className="text-lg font-semibold text-zinc-50">
              ₩{restaurant.budget.toLocaleString("ko-KR")}
            </span>
          </div>

          <form action={updateAction} className="mt-4 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <label htmlFor="visited" className="text-sm text-zinc-200">
                다녀왔어요
              </label>
              <input
                id="visited"
                type="checkbox"
                name="visited"
                defaultChecked={restaurant.visited}
                className="peer sr-only"
              />
              <label
                htmlFor="visited"
                className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full bg-zinc-700 transition peer-checked:bg-orange-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
              />
            </div>

            <div>
              <p className="text-sm text-zinc-400">별점</p>
              <div className="mt-1">
                <RatingInput defaultValue={restaurant.rating} />
              </div>
            </div>

            <div>
              <label htmlFor="memo" className="text-sm text-zinc-400">
                메모
              </label>
              <textarea
                id="memo"
                name="memo"
                rows={3}
                defaultValue={restaurant.memo ?? ""}
                placeholder="한 줄 메모를 남겨보세요"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl border border-white/10 py-3 font-medium text-zinc-100 transition hover:border-orange-500/60"
              >
                수정
              </button>
            </div>
          </form>

          <form action={deleteAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-xl py-3 font-medium text-red-400 transition hover:bg-red-950/30"
            >
              삭제
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
