import { NextRequest, NextResponse } from "next/server";
import { refreshAll } from "@/lib/fetch-feeds";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const expected = process.env.REFRESH_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "REFRESH_TOKEN not configured" }, { status: 500 });
  }
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("token");
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { results, pruned } = await refreshAll();
  return NextResponse.json({ pruned, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
