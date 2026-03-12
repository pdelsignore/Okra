import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyOwnership(krId: string, userId: string) {
  return prisma.keyResult.findFirst({
    where: { id: krId, objective: { userId } },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const kr = await verifyOwnership(id, session.user.id);
  if (!kr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, targetValue, unit, type } = await req.json();
  const updated = await prisma.keyResult.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(targetValue !== undefined && { targetValue: Number(targetValue) }),
      ...(unit !== undefined && { unit }),
      ...(type !== undefined && { type: type === "COUNT" ? "COUNT" : "PERCENTAGE" }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const kr = await verifyOwnership(id, session.user.id);
  if (!kr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.keyResult.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
