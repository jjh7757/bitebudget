import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: number;
  name: string;
  food: string;
};

export default async function Home() {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, food")
    .order("id");

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          🍽️ 맛집 음식 목록
        </h1>

        {error && (
          <p className="text-red-500">목록을 불러오지 못했습니다: {error.message}</p>
        )}

        {!error && (
          <ul className="flex w-full max-w-md flex-col gap-3">
            {(restaurants as Restaurant[] | null)?.map((restaurant) => (
              <li
                key={restaurant.id}
                className="flex items-center justify-between rounded-lg border border-black/[.08] px-5 py-4 dark:border-white/[.145]"
              >
                <span className="font-medium text-black dark:text-zinc-50">
                  {restaurant.name}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {restaurant.food}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
