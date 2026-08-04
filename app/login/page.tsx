"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setPending(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setPending(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSignupDone(true);
      }
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-sm p-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <UtensilsCrossed className="h-6 w-6 text-primary-600" />
          BiteBudget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          예산 안에서 갈만한 맛집을 관리해요
        </p>

        <div className="mt-6 flex rounded-md bg-muted p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSignupDone(false);
            }}
            className={cn(
              "flex-1 rounded-sm py-2 transition",
              mode === "login"
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground"
            )}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setSignupDone(false);
            }}
            className={cn(
              "flex-1 rounded-sm py-2 transition",
              mode === "signup"
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground"
            )}
          >
            회원가입
          </button>
        </div>

        {signupDone ? (
          <p className="mt-6 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            가입 확인 이메일을 보냈어요. 이메일을 확인한 뒤 로그인해주세요.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
