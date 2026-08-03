export const CATEGORIES = ["한식", "중식", "일식", "양식", "카페"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_STYLES: Record<string, string> = {
  한식: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  중식: "bg-rose-900/40 text-rose-300 border-rose-800/60",
  일식: "bg-sky-900/40 text-sky-300 border-sky-800/60",
  양식: "bg-zinc-700/40 text-zinc-300 border-zinc-600/60",
  카페: "bg-amber-800/40 text-amber-300 border-amber-700/60",
};

export function categoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? "bg-zinc-700/40 text-zinc-300 border-zinc-600/60";
}

export const CATEGORY_CHIP_STYLES: Record<string, string> = {
  한식:
    "peer-checked:border-orange-500 peer-checked:bg-orange-500/20 peer-checked:text-orange-300",
  중식:
    "peer-checked:border-rose-700 peer-checked:bg-rose-900/40 peer-checked:text-rose-300",
  일식:
    "peer-checked:border-sky-700 peer-checked:bg-sky-900/40 peer-checked:text-sky-300",
  양식:
    "peer-checked:border-zinc-500 peer-checked:bg-zinc-700/40 peer-checked:text-zinc-200",
  카페:
    "peer-checked:border-amber-700 peer-checked:bg-amber-800/40 peer-checked:text-amber-300",
};

export function categoryChipStyle(category: string) {
  return (
    CATEGORY_CHIP_STYLES[category] ??
    "peer-checked:border-zinc-500 peer-checked:bg-zinc-700/40 peer-checked:text-zinc-200"
  );
}
