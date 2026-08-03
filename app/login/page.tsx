"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="flex flex-1 items-center justify-center bg-[#161b16] px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1e241e] p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-zinc-50">
          🍽️ BiteBudget
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          예산 안에서 갈만한 맛집을 관리해요
        </p>

        <div className="mt-6 flex rounded-xl bg-black/30 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSignupDone(false);
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === "login"
                ? "bg-orange-600 text-white"
                : "text-zinc-400"
            }`}
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
            className={`flex-1 rounded-lg py-2 transition ${
              mode === "signup"
                ? "bg-orange-600 text-white"
                : "text-zinc-400"
            }`}
          >
            회원가입
          </button>
        </div>

        {signupDone ? (
          <p className="mt-6 rounded-xl bg-black/20 p-4 text-sm text-zinc-300">
            가입 확인 이메일을 보냈어요. 이메일을 확인한 뒤 로그인해주세요.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-sm text-zinc-400">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">비밀번호</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-50 outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-xl bg-orange-600 py-3 font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
