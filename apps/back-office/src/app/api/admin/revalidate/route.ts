import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/firebase-admin";

const EXACT_TAGS = new Set([
  "clubs",
  "scenarios",
  "notices",
  "market-prices",
  "organizations",
  "users",
]);

const PREFIX_TAGS = ["clubs:", "scenario:", "market-prices:", "memberships:"];

function isAllowedTag(tag: string): boolean {
  if (EXACT_TAGS.has(tag)) return true;
  return PREFIX_TAGS.some((p) => tag.startsWith(p) && tag.length > p.length);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const tags: unknown = body?.tags;

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "tags 배열이 필요합니다." },
        { status: 400 },
      );
    }

    const valid: string[] = [];
    const rejected: string[] = [];
    for (const t of tags) {
      if (typeof t === "string" && isAllowedTag(t)) {
        valid.push(t);
      } else if (typeof t === "string") {
        rejected.push(t);
      }
    }

    for (const tag of valid) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      success: true,
      revalidated: valid,
      rejected,
    });
  } catch (error) {
    console.error("revalidate route error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 },
    );
  }
}
