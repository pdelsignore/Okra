import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeAlignment } from "@/lib/alignment";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title) return NextResponse.json([]);

  const suggestions = await computeAlignment(session.user.id, title, description ?? null);
  return NextResponse.json(suggestions);
}
