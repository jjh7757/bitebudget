import { UtensilsCrossed } from "lucide-react";

export default function TestPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-6 py-32 px-16 text-center">
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
          <UtensilsCrossed className="h-8 w-8 text-primary-600" />
          BiteBudget 테스트 페이지
        </h1>
        <p className="max-w-md text-lg leading-8 text-muted-foreground">
          이 페이지는 Vercel 배포 확인용으로 만들어졌습니다.
        </p>
      </main>
    </div>
  );
}
