"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export default function RatingInput({
  defaultValue,
}: {
  defaultValue: number | null;
}) {
  const [value, setValue] = useState(defaultValue ?? 0);

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name="rating" value={value || ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(n === value ? 0 : n)}
          aria-label={`${n}점`}
          className="transition"
        >
          <Star
            className={cn(
              "h-7 w-7",
              n <= value
                ? "fill-primary-500 text-primary-500"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}
