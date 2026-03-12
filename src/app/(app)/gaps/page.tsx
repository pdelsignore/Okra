import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKeyResultProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

function gapStyle(pct: number) {
  if (pct < 20) return { border: "1.5px solid rgba(235,87,87,0.30)", bg: "rgba(235,87,87,0.04)", color: "#EB5757" };
  if (pct < 50) return { border: "1.5px solid rgba(242,153,74,0.30)", bg: "rgba(242,153,74,0.04)", color: "#F2994A" };
  return { border: "1.5px solid rgba(39,174,96,0.25)", bg: "rgba(39,174,96,0.04)", color: "#27AE60" };
}

export default async function GapsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const objectives = await prisma.objective.findMany({
    where: { userId, status: "ACTIVE" },
    include: { keyResults: { include: { kpis: true, alignments: { include: { task: true } } } } },
  });

  const rows = [];
  for (const obj of objectives) {
    for (const kr of obj.keyResults) {
      const progressPct = Math.min(Math.round((await getKeyResultProgress(kr.id) / kr.targetValue) * 100), 100);
      const alignedTaskCount = new Set(kr.alignments.map((a) => a.taskId)).size;
      rows.push({ objectiveTitle: obj.title, objectiveId: obj.id, krId: kr.id, krTitle: kr.title, progressPct, alignedTaskCount, kpiCount: kr.kpis.length });
    }
  }
  rows.sort((a, b) => a.progressPct - b.progressPct);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Gaps</h1>
        <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>Key results that need more attention</p>
      </div>

      {rows.length === 0 ? (
        <div className="okra-card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#828282", marginBottom: 10 }}>No active objectives with key results.</p>
          <Link href="/objectives/new" style={{ fontSize: 13, fontWeight: 600, color: "#0892A5", textDecoration: "none" }}>Create an objective →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => {
            const s = gapStyle(row.progressPct);
            return (
              <Link
                key={row.krId}
                href={`/objectives/${row.objectiveId}`}
                className="gap-row"
                style={{ display: "block", textDecoration: "none", borderRadius: 16, padding: 20, background: s.bg, border: s.border, boxShadow: "0px 4px 20px rgba(0,0,0,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: "#828282", marginBottom: 3 }}>{row.objectiveTitle}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0E1B3D" }}>{row.krTitle}</p>
                    <p style={{ fontSize: 11, color: "#828282", marginTop: 4 }}>
                      {row.alignedTaskCount} aligned task{row.alignedTaskCount !== 1 ? "s" : ""} · {row.kpiCount} KPI{row.kpiCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", flexShrink: 0 }}>
                    {row.progressPct}%
                  </span>
                </div>
                <Progress value={row.progressPct} className="h-1.5 mt-3" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
