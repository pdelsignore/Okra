import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await params;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId: session.user.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { keyResultId, kpiId, contribution } = await req.json();
  if (!keyResultId) return NextResponse.json({ error: "keyResultId required" }, { status: 400 });

  const kr = await prisma.keyResult.findFirst({
    where: { id: keyResultId, objective: { userId: session.user.id } },
  });
  if (!kr) return NextResponse.json({ error: "Key result not found" }, { status: 404 });

  // One alignment per task — replace any existing alignment
  await prisma.taskAlignment.deleteMany({ where: { taskId } });

  const alignment = await prisma.taskAlignment.create({
    data: {
      taskId,
      keyResultId,
      kpiId: kpiId ?? null,
      contribution: kr.type === "COUNT" ? 1 : Number(contribution ?? 100),
      confidence: 0,
      isOverridden: true,
    },
    include: {
      kpi: true,
      keyResult: { include: { objective: true } },
    },
  });

  return NextResponse.json(alignment, { status: 201 });
}
