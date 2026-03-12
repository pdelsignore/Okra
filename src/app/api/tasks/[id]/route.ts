import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  // If marking done, set completedAt
  if (data.status === "DONE") data.completedAt = new Date().toISOString();
  else if (data.status && data.status !== "DONE") data.completedAt = null;

  const task = await prisma.task.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.task.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
