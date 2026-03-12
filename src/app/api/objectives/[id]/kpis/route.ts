import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: objectiveId } = await params;

  const { keyResultId, title, description, keywords } = await req.json();
  if (!keyResultId || !title || !keywords) {
    return NextResponse.json({ error: "keyResultId, title, and keywords required" }, { status: 400 });
  }

  const kr = await prisma.keyResult.findFirst({
    where: { id: keyResultId, objectiveId, objective: { userId: session.user.id } },
  });
  if (!kr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const kpi = await prisma.kPI.create({
    data: { keyResultId, title, description, keywords },
  });

  return NextResponse.json(kpi, { status: 201 });
}
