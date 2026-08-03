"use client";

import { useState } from "react";

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
          className={`text-2xl leading-none transition ${
            n <= value ? "text-orange-400" : "text-zinc-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
