import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids }: { ids: string[] } = await req.json();
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids array required" }, { status: 400 });

  await Promise.all(
    ids.map((id, index) =>
      prisma.objective.updateMany({
        where: { id, userId: session.user!.id! },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
