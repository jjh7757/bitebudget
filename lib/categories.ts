export const CATEGORIES = ["한식", "중식", "일식", "양식", "카페"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_STYLES: Record<string, string> = {
  한식: "bg-orange-100 text-orange-700 border-orange-200",
  중식: "bg-rose-100 text-rose-700 border-rose-200",
  일식: "bg-sky-100 text-sky-700 border-sky-200",
  양식: "bg-stone-100 text-stone-700 border-stone-200",
  카페: "bg-amber-100 text-amber-700 border-amber-200",
};

export function categoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? "bg-stone-100 text-stone-700 border-stone-200";
}

export const CATEGORY_CHIP_STYLES: Record<string, string> = {
  한식: "peer-checked:border-orange-400 peer-checked:bg-orange-100 peer-checked:text-orange-700",
  중식: "peer-checked:border-rose-300 peer-checked:bg-rose-100 peer-checked:text-rose-700",
  일식: "peer-checked:border-sky-300 peer-checked:bg-sky-100 peer-checked:text-sky-700",
  양식: "peer-checked:border-stone-300 peer-checked:bg-stone-100 peer-checked:text-stone-700",
  카페: "peer-checked:border-amber-300 peer-checked:bg-amber-100 peer-checked:text-amber-700",
};

export function categoryChipStyle(category: string) {
  return (
    CATEGORY_CHIP_STYLES[category] ??
    "peer-checked:border-stone-300 peer-checked:bg-stone-100 peer-checked:text-stone-700"
  );
}
