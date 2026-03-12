import { prisma } from "./prisma";

// Returns a value between 0 and targetValue.
export async function getKeyResultProgress(keyResultId: string): Promise<number> {
  const kr = await prisma.keyResult.findUnique({
    where: { id: keyResultId },
    include: { alignments: { include: { task: true } } },
  });
  if (!kr) return 0;

  const done = kr.alignments.filter((a) => a.task.status === "DONE");

  if (kr.type === "COUNT") {
    return Math.min(done.length, kr.targetValue);
  }

  // PERCENTAGE: sum contributions, scale to targetValue
  const total = done.reduce((sum, a) => sum + a.contribution, 0);
  return Math.min(total / 100, 1) * kr.targetValue;
}

export async function getObjectiveProgress(objectiveId: string): Promise<number> {
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: { keyResults: true },
  });
  if (!objective || objective.keyResults.length === 0) return 0;

  const progresses = await Promise.all(
    objective.keyResults.map((kr) => getKeyResultProgress(kr.id))
  );

  const percentages = objective.keyResults.map((kr, i) => {
    const pct = kr.targetValue > 0 ? (progresses[i] / kr.targetValue) * 100 : 0;
    return Math.min(pct, 100);
  });

  return Math.round(
    percentages.reduce((sum, p) => sum + p, 0) / percentages.length
  );
}
