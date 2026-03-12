import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: objectiveId } = await params;

  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, userId: session.user.id },
  });
  if (!objective) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, targetValue, unit, type } = await req.json();
  if (!title || targetValue === undefined) {
    return NextResponse.json({ error: "Title and targetValue required" }, { status: 400 });
  }

  const krType: string = type === "COUNT" ? "COUNT" : "PERCENTAGE";

  const kr = await prisma.keyResult.create({
    data: { objectiveId, title, description, targetValue: Number(targetValue), unit, type: krType },
  });

  return NextResponse.json(kr, { status: 201 });
}
