import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAlignment } from "@/lib/alignment";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    include: {
      alignments: { include: { kpi: true, keyResult: { include: { objective: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, manualAlignments } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await prisma.task.create({
    data: { userId: session.user.id, title, description },
  });

  if (Array.isArray(manualAlignments) && manualAlignments.length > 0) {
    // Use the first manual alignment only (one KR per task)
    const m = manualAlignments[0] as { keyResultId: string; kpiId?: string; contribution: number };
    const kr = await prisma.keyResult.findFirst({ where: { id: m.keyResultId } });
    await prisma.taskAlignment.create({
      data: {
        taskId: task.id,
        keyResultId: m.keyResultId,
        kpiId: m.kpiId ?? null,
        contribution: kr?.type === "COUNT" ? 1 : m.contribution,
        confidence: 0,
        isOverridden: true,
      },
    });
  } else {
    // Auto-align to the single best KR
    const suggestions = await computeAlignment(session.user.id, title, description ?? null);
    if (suggestions.length > 0) {
      const s = suggestions[0];
      await prisma.taskAlignment.create({
        data: {
          taskId: task.id,
          kpiId: s.kpiId,
          keyResultId: s.keyResultId,
          contribution: s.contribution,
          confidence: s.confidence,
        },
      });
    }
  }

  const taskWithAlignments = await prisma.task.findUnique({
    where: { id: task.id },
    include: {
      alignments: { include: { kpi: true, keyResult: { include: { objective: true } } } },
    },
  });

  return NextResponse.json(taskWithAlignments, { status: 201 });
}
