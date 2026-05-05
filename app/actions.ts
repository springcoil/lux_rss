"use server";

import { revalidatePath } from "next/cache";
import { refreshAll } from "@/lib/fetch-feeds";

export async function runRefresh() {
  const { results, pruned } = await refreshAll();
  const inserted = results.reduce((n, r) => n + r.inserted, 0);
  const failed = results.filter((r) => r.error).length;
  revalidatePath("/");
  return { inserted, pruned, sources: results.length, failed };
}
