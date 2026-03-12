import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectiveProgress } from "@/lib/progress";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DONE:        { bg: "rgba(39,174,96,0.12)",   color: "#27AE60", label: "Done" },
  IN_PROGRESS: { bg: "rgba(8,146,165,0.10)",  color: "#0892A5", label: "In Progress" },
  TODO:        { bg: "rgba(130,130,130,0.10)", color: "#828282", label: "To Do" },
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const objectives = await prisma.objective.findMany({
    where: { userId, status: "ACTIVE" },
    include: { keyResults: true },
    orderBy: { createdAt: "desc" },
  });

  const recentTasks = await prisma.task.findMany({
    where: { userId },
    include: {
      alignments: { include: { kpi: true, keyResult: { include: { objective: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const objectivesWithProgress = await Promise.all(
    objectives.map(async (obj) => ({
      ...obj,
      progress: await getObjectiveProgress(obj.id),
    }))
  );

  const doneCount = await prisma.task.count({ where: { userId, status: "DONE" } });
  const totalTasks = await prisma.task.count({ where: { userId } });
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const objectivesProgress = objectivesWithProgress.length > 0
    ? Math.round(objectivesWithProgress.reduce((sum, obj) => sum + obj.progress, 0) / objectivesWithProgress.length)
    : 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Hi, Welcome Back {session?.user?.name?.split(" ")[0] ?? ""}!</h1>
          <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>
            Your OKR alignment at a glance
          </p>
        </div>
        <Link href="/tasks/new" className="btn-primary">+ New Task</Link>
      </div>

      {/* Unified 3-column grid: stat cards row 1, content row 2 */}
      <div className="dashboard-grid">
        {/* Active Objectives */}
        <div className="okra-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#828282", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
            Active Objectives
          </p>
          <p style={{ fontSize: 36, fontWeight: 800, color: "#0E1B3D", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {objectives.length}
          </p>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F2F2F2" }}>
            <Link href="/objectives" style={{ fontSize: 12, fontWeight: 600, color: "#0892A5", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="okra-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#828282", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
            Tasks Completed
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#0E1B3D", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {doneCount}
            </p>
            {totalTasks > 0 && (
              <span className="trend-up">↑ {completionRate}%</span>
            )}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F2F2F2" }}>
            <span style={{ fontSize: 12, color: "#828282" }}>of {totalTasks} total tasks</span>
          </div>
        </div>

        {/* Objective Progress */}
        <div className="okra-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#828282", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
            Objective Progress
          </p>
          <p style={{ fontSize: 36, fontWeight: 800, color: "#EB5757", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {objectivesProgress}%
          </p>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F2F2F2" }}>
            <Progress value={objectivesProgress} className="h-1.5" />
          </div>
        </div>

        {/* Objectives progress — spans first 2 columns */}
        <div className="okra-card dashboard-objectives" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 className="section-title" style={{ fontSize: 16 }}>Objectives</h2>
            <Link href="/objectives/new" className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
              + New
            </Link>
          </div>

          {objectivesWithProgress.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 13, color: "#828282", marginBottom: 8 }}>No objectives yet.</p>
              <Link href="/objectives/new" style={{ fontSize: 13, color: "#0892A5", fontWeight: 600, textDecoration: "none" }}>
                Create your first →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {objectivesWithProgress.map((obj) => (
                <Link
                  key={obj.id}
                  href={`/objectives/${obj.id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1B3D", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {obj.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#EB5757", marginLeft: 8, flexShrink: 0 }}>
                      {obj.progress}%
                    </span>
                  </div>
                  <Progress value={obj.progress} className="h-1.5" />
                  <p style={{ fontSize: 11, color: "#828282", marginTop: 4 }}>
                    {obj.keyResults.length} key result{obj.keyResults.length !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks — spans 3rd column */}
        <div className="okra-card dashboard-recent-tasks" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 className="section-title" style={{ fontSize: 16 }}>Recent Tasks</h2>
          </div>

          {recentTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 13, color: "#828282" }}>No tasks yet.</p>
            </div>
          ) : (
            <div>
              {recentTasks.map((task, i) => {
                const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.TODO;
                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: i < recentTasks.length - 1 ? "1px solid #F2F2F2" : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0E1B3D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.title}
                      </p>
                      {task.alignments[0] && (
                        <p style={{ fontSize: 11, color: "#828282", marginTop: 2 }}>
                          {task.alignments[0].kpi?.title ?? task.alignments[0].keyResult.title}
                        </p>
                      )}
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: s.bg, color: s.color, flexShrink: 0 }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
