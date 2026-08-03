"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/categories";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createRestaurant(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const budget = Number(formData.get("budget"));

  if (
    !name ||
    !CATEGORIES.includes(category as Category) ||
    !address ||
    !Number.isFinite(budget) ||
    budget < 0
  ) {
    redirect("/restaurants/new?error=1");
  }

  const { data, error } = await supabase
    .from("restaurants")
    .insert({ name, category, address, budget, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/restaurants/new?error=1");
  }

  revalidatePath("/");
  redirect(`/restaurants/${data.id}`);
}

export async function updateRestaurantStatus(id: number, formData: FormData) {
  const supabase = await createClient();
  const visited = formData.get("visited") === "on";
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  await supabase
    .from("restaurants")
    .update({ visited, rating, memo })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath(`/restaurants/${id}`);
  redirect(`/restaurants/${id}`);
}

export async function deleteRestaurant(id: number) {
  const supabase = await createClient();
  await supabase.from("restaurants").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}
