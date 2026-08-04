import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createRestaurant } from "@/lib/actions";
import { CATEGORIES, categoryChipStyle } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function NewRestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        <h1 className="text-2xl font-semibold text-foreground">맛집 등록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이름 · 카테고리 · 주소 · 예산만 적어두면 돼요
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          입력값을 다시 확인해주세요.
        </p>
      )}

      <form action={createRestaurant} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">이름</Label>
          <Input id="name" name="name" required placeholder="예: 홍대 온면집" />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-muted-foreground">카테고리</legend>
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
                  className={`cursor-pointer rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition ${categoryChipStyle(
                    c
                  )}`}
                >
                  {c}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">주소</Label>
          <Input
            id="address"
            name="address"
            required
            placeholder="예: 서울 마포구 서교동"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budget">예산</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min={0}
            step={500}
            required
            placeholder="9500"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          별점과 메모는 다녀온 뒤 상세 화면에서 남길 수 있어요.
        </p>

        <Button type="submit">저장</Button>
      </form>
    </div>
  );
}
