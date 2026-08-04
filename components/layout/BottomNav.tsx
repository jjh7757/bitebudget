"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, LogOut } from "lucide-react";

import { signOut } from "@/lib/actions";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "목록", icon: Home },
  { href: "/recommend", label: "추천", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-md items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-4 py-1.5 text-xs font-medium transition",
                active
                  ? "text-primary-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
        <form action={signOut}>
          <button
            type="submit"
            className="flex flex-col items-center gap-1 rounded-md px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  );
}
