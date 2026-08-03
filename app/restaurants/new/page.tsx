import Link from "next/link";
import { createRestaurant } from "@/lib/actions";
import { CATEGORIES, categoryChipStyle } from "@/lib/categories";

export default async function NewRestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-[#161b16] px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← 목록으로
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">맛집 등록</h1>
          <p className="mt-1 text-sm text-zinc-400">
            이름 · 카테고리 · 주소 · 예산만 적어두면 돼요
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-950/40 px-4 py-2 text-sm text-red-400">
            입력값을 다시 확인해주세요.
          </p>
        )}

        <form action={createRestaurant} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="text-sm text-zinc-400">
              이름
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="예: 홍대 온면집"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1e241e] px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
            />
          </div>

          <fieldset>
            <legend className="text-sm text-zinc-400">카테고리</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c, i) => (
                <label key={c}>
                  <input
                    type="radio"
                    name="category"
                    value={c}
                    required
                    defaultChecked={i === 0}
                    className="peer sr-only"
                  />
                  <span
                    className={`cursor-pointer rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-zinc-500 transition ${categoryChipStyle(
                      c
                    )}`}
                  >
                    {c}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="address" className="text-sm text-zinc-400">
              주소
            </label>
            <input
              id="address"
              name="address"
              required
              placeholder="예: 서울 마포구 서교동"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1e241e] px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="budget" className="text-sm text-zinc-400">
              예산
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min={0}
              step={500}
              required
              placeholder="9500"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1e241e] px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
            />
          </div>

          <p className="text-xs text-zinc-500">
            별점과 메모는 다녀온 뒤 상세 화면에서 남길 수 있어요.
          </p>

          <button
            type="submit"
            className="rounded-xl bg-orange-600 py-3 font-medium text-white transition hover:bg-orange-500"
          >
            저장
          </button>
        </form>
      </div>
    </div>
  );
}
