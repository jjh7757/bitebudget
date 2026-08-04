import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteRestaurant, updateRestaurantStatus } from "@/lib/actions";
import { categoryStyle } from "@/lib/categories";
import RatingInput from "@/components/RatingInput";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

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
    .single();

  if (!restaurant) notFound();

  const isOwner = restaurant.user_id === user.id;

  let ownerLabel = "알 수 없음";
  if (!isOwner) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", restaurant.user_id)
      .single();
    ownerLabel = profile?.email.split("@")[0] ?? ownerLabel;
  }

  const updateAction = updateRestaurantStatus.bind(null, restaurant.id);
  const deleteAction = deleteRestaurant.bind(null, restaurant.id);

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Badge className={categoryStyle(restaurant.category)}>
            {restaurant.category}
          </Badge>
          {!isOwner && (
            <span className="text-xs text-muted-foreground">
              등록자: {ownerLabel}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          {restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{restaurant.address}</p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">예산</span>
          <span className="text-lg font-semibold text-foreground">
            ₩{restaurant.budget.toLocaleString("ko-KR")}
          </span>
        </div>

        {isOwner ? (
          <>
            <form action={updateAction} className="mt-4 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="visited">다녀왔어요</Label>
                <Switch
                  id="visited"
                  name="visited"
                  defaultChecked={restaurant.visited}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">별점</p>
                <div className="mt-1">
                  <RatingInput defaultValue={restaurant.rating} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  name="memo"
                  rows={3}
                  defaultValue={restaurant.memo ?? ""}
                  placeholder="한 줄 메모를 남겨보세요"
                />
              </div>

              <Button type="submit" variant="outline">
                수정
              </Button>
            </form>

            <form action={deleteAction} className="mt-3">
              <Button type="submit" variant="destructive" className="w-full">
                삭제
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">다녀왔어요</span>
              <span className="text-sm text-foreground">
                {restaurant.visited ? "예" : "아니오"}
              </span>
            </div>
            {restaurant.visited && (
              <div>
                <p className="text-sm text-muted-foreground">별점</p>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < (restaurant.rating ?? 0)
                          ? "fill-primary-500 text-primary-500"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            {restaurant.memo && (
              <div>
                <p className="text-sm text-muted-foreground">메모</p>
                <p className="mt-1 text-foreground">{restaurant.memo}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              다른 사용자가 등록한 맛집이라 수정·삭제는 할 수 없어요.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
