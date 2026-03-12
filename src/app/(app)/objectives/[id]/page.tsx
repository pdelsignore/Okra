import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKeyResultProgress } from "@/lib/progress";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ObjectiveDetailClient from "./ObjectiveDetailClient";

export default async function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const userId = session!.user!.id!;

  const objective = await prisma.objective.findFirst({
    where: { id, userId },
    include: {
      keyResults: {
        orderBy: { order: "asc" },
        include: {
          kpis: { orderBy: { order: "asc" } },
          alignments: {
            include: { task: true, kpi: true },
          },
        },
      },
    },
  });

  if (!objective) notFound();

  const keyResultsWithProgress = await Promise.all(
    objective.keyResults.map(async (kr) => ({
      ...kr,
      progress: await getKeyResultProgress(kr.id),
      progressPct: Math.min(
        Math.round((await getKeyResultProgress(kr.id) / kr.targetValue) * 100),
        100
      ),
    }))
  );

  return (
    <ObjectiveDetailClient
      objective={objective}
      keyResultsWithProgress={keyResultsWithProgress}
    />
  );
}
