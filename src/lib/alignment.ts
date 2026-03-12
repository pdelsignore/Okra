import { prisma } from "./prisma";

function stem(word: string): string {
  return word
    .toLowerCase()
    .replace(/ing$|tion$|tions$|ed$|ly$|es$|s$/, "");
}

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "i", "my", "we", "our", "you", "your",
  "this", "that", "it", "its", "their", "they", "he", "she", "least",
  "at", "e", "g", "eg", "etc", "per", "via",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
      .map(stem)
  );
}

function overlap(taskTokens: Set<string>, sourceText: string): number {
  const sourceTokens = tokenize(sourceText);
  let count = 0;
  for (const token of taskTokens) {
    if (sourceTokens.has(token)) count++;
  }
  return sourceTokens.size > 0 ? count / Math.sqrt(sourceTokens.size) : 0;
}

function scoreKR(
  taskTokens: Set<string>,
  kr: { title: string; description: string | null },
  kpis: { title: string; description: string | null; keywords: string }[]
): number {
  let score = overlap(taskTokens, kr.title) * 2.0;
  if (kr.description) score += overlap(taskTokens, kr.description) * 1.0;

  if (kpis.length > 0) {
    const kpiBoost = kpis.reduce((max, kpi) => {
      const s =
        overlap(taskTokens, kpi.keywords) * 2.0 +
        overlap(taskTokens, kpi.title) * 1.5 +
        overlap(taskTokens, kpi.description ?? "") * 1.0;
      return Math.max(max, s);
    }, 0);
    score = Math.max(score, kpiBoost);
  }

  return score;
}

export interface AlignmentSuggestion {
  kpiId: string | null;
  kpiTitle: string | null;
  keyResultId: string;
  keyResultTitle: string;
  keyResultType: string;
  objectiveTitle: string;
  contribution: number;
  confidence: number;
}

export async function computeAlignment(
  userId: string,
  taskTitle: string,
  taskDescription: string | null
): Promise<AlignmentSuggestion[]> {
  const keyResults = await prisma.keyResult.findMany({
    where: { objective: { userId } },
    include: { kpis: true, objective: true },
  });

  if (keyResults.length === 0) return [];

  const text = `${taskTitle} ${taskDescription ?? ""}`;
  const taskTokens = tokenize(text);

  const scored = keyResults
    .map((kr) => {
      const bestKpi = kr.kpis.length > 0
        ? kr.kpis.reduce<typeof kr.kpis[0] | null>((best, kpi) => {
            const s =
              overlap(taskTokens, kpi.keywords) * 2.0 +
              overlap(taskTokens, kpi.title) * 1.5;
            const bestScore = best
              ? overlap(taskTokens, best.keywords) * 2.0 + overlap(taskTokens, best.title) * 1.5
              : -1;
            return s > bestScore ? kpi : best;
          }, null)
        : null;

      return {
        kpiId: bestKpi?.id ?? null,
        kpiTitle: bestKpi?.title ?? null,
        keyResultId: kr.id,
        keyResultTitle: kr.title,
        objectiveTitle: kr.objective.title,
        krType: kr.type,
        confidence: scoreKR(taskTokens, kr, kr.kpis),
      };
    })
    .filter((s) => s.confidence >= 0.1)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) return [];

  // Pick only the single best-matching KR
  const best = scored[0];
  const contribution = best.krType === "COUNT" ? 1 : Math.min(Math.round(best.confidence * 100), 100);

  return [{
    kpiId: best.kpiId,
    kpiTitle: best.kpiTitle,
    keyResultId: best.keyResultId,
    keyResultTitle: best.keyResultTitle,
    keyResultType: best.krType,
    objectiveTitle: best.objectiveTitle,
    contribution,
    confidence: best.confidence,
  }];
}
