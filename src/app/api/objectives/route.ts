import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const objectives = await prisma.objective.findMany({
    where: { userId: session.user.id },
    include: {
      keyResults: {
        include: { kpis: true, alignments: { include: { task: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(objectives);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const objective = await prisma.objective.create({
    data: {
      userId: session.user.id,
      title,
      description,
    },
  });

  return NextResponse.json(objective, { status: 201 });
}
