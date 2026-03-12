import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectiveProgress } from "@/lib/progress";
import Link from "next/link";
import ObjectivesSortable from "./ObjectivesSortable";

export default async function ObjectivesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const objectives = await prisma.objective.findMany({
    where: { userId },
    include: { keyResults: { include: { kpis: true } } },
    orderBy: { order: "asc" },
  });

  const withProgress = await Promise.all(
    objectives.map(async (obj) => ({
      ...obj,
      progress: await getObjectiveProgress(obj.id),
    }))
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Objectives</h1>
          <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>Your goals and key results</p>
        </div>
        <Link href="/objectives/new" className="btn-primary">
          + New objective
        </Link>
      </div>

      {withProgress.length === 0 ? (
        <div className="okra-card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#828282", marginBottom: 10 }}>No objectives yet.</p>
          <Link href="/objectives/new" style={{ fontSize: 13, fontWeight: 600, color: "#3D7BFF", textDecoration: "none" }}>
            Create your first objective →
          </Link>
        </div>
      ) : (
        <ObjectivesSortable objectives={withProgress} />
      )}
    </div>
  );
}
