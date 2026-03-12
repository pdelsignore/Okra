import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const objective = await prisma.objective.findFirst({
    where: { id, userId: session.user.id },
    include: {
      keyResults: {
        include: {
          kpis: true,
          alignments: { include: { task: true, kpi: true } },
        },
      },
    },
  });

  if (!objective) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(objective);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const objective = await prisma.objective.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json(objective);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.objective.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
