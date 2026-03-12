import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { contribution } = await req.json();

  // Verify ownership via task
  const alignment = await prisma.taskAlignment.findFirst({
    where: { id, task: { userId: session.user.id } },
  });
  if (!alignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.taskAlignment.update({
    where: { id },
    data: { contribution: Number(contribution), isOverridden: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const alignment = await prisma.taskAlignment.findFirst({
    where: { id, task: { userId: session.user.id } },
  });
  if (!alignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.taskAlignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
