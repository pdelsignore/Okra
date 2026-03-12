import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectiveProgress, getKeyResultProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import PrintButton from "./PrintButton";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DONE:        { bg: "rgba(39,174,96,0.12)",   color: "#27AE60", label: "Done" },
  IN_PROGRESS: { bg: "rgba(8,146,165,0.10)",  color: "#0892A5", label: "In Progress" },
  TODO:        { bg: "rgba(130,130,130,0.10)", color: "#828282", label: "To Do" },
};

export default async function ReportPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const objectives = await prisma.objective.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      keyResults: {
        orderBy: { order: "asc" },
        include: { alignments: { include: { task: true, kpi: true }, orderBy: { task: { status: "asc" } } } },
      },
    },
    orderBy: { order: "asc" },
  });

  const objectivesWithProgress = await Promise.all(
    objectives.map(async (obj) => ({
      ...obj,
      progress: await getObjectiveProgress(obj.id),
      keyResults: await Promise.all(
        obj.keyResults.map(async (kr) => {
          const krProgress = await getKeyResultProgress(kr.id);
          return { ...kr, krProgress, progressPct: Math.min(Math.round((krProgress / kr.targetValue) * 100), 100) };
        })
      ),
    }))
  );

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Okra Report</h1>
          <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>{user?.name} · {today}</p>
        </div>
        <PrintButton />
      </div>

      {objectivesWithProgress.length === 0 ? (
        <div className="okra-card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#828282" }}>No active objectives.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {objectivesWithProgress.map((obj) => (
            <div key={obj.id}>
              {/* Objective header */}
              <div className="okra-card" style={{ padding: 24, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0E1B3D" }}>{obj.title}</h2>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#EB5757", letterSpacing: "-0.02em", marginLeft: 16, flexShrink: 0 }}>{obj.progress}%</span>
                </div>
                {obj.description && <p style={{ fontSize: 13, color: "#828282", marginBottom: 12 }}>{obj.description}</p>}
                <Progress value={obj.progress} className="h-1.5" />
              </div>

              {/* Key Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {obj.keyResults.map((kr) => (
                  <div key={kr.id} className="okra-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #F2F2F2" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                              padding: "2px 7px", borderRadius: 4,
                              background: kr.type === "COUNT" ? "rgba(8,146,165,0.10)" : "rgba(130,130,130,0.10)",
                              color: kr.type === "COUNT" ? "#0892A5" : "#828282",
                            }}
                          >
                            {kr.type === "COUNT" ? "#" : "%"}
                          </span>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0E1B3D" }}>{kr.title}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#EB5757", flexShrink: 0, marginLeft: 16 }}>
                          {kr.type === "COUNT" ? `${Math.round(kr.krProgress)} / ${kr.targetValue} ${kr.unit ?? ""}` : `${kr.progressPct}%`}
                        </span>
                      </div>
                      <Progress value={kr.progressPct} className="h-1" />
                    </div>

                    {kr.alignments.length > 0 ? (
                      <table className="okra-table">
                        <thead>
                          <tr>
                            <th>Task</th>
                            <th>KPI</th>
                            <th style={{ textAlign: "right" }}>Contribution</th>
                            <th style={{ textAlign: "right" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kr.alignments.map((a) => {
                            const s = STATUS_STYLE[a.task.status] ?? STATUS_STYLE.TODO;
                            return (
                              <tr key={a.id}>
                                <td style={{ fontWeight: 500 }}>{a.task.title}</td>
                                <td style={{ color: "#828282" }}>{a.kpi?.title ?? "—"}</td>
                                <td style={{ textAlign: "right", color: "#828282" }}>
                                  {kr.type === "COUNT" ? "1 unit" : `${a.contribution}%`}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <span className="status-badge" style={{ background: s.bg, color: s.color, fontSize: 11 }}>
                                    {s.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ padding: "14px 24px", fontSize: 12, color: "#B0BAC9", fontStyle: "italic" }}>
                        No tasks aligned to this key result.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
