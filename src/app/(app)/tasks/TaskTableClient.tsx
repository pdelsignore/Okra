"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface Alignment {
  id: string;
  contribution: number;
  isOverridden: boolean;
  kpi: { title: string } | null;
  keyResult: { id: string; title: string; type: string; objective: { title: string } };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  alignments: Alignment[];
}

interface KR {
  id: string;
  title: string;
  type: string;
  kpis: { id: string; title: string }[];
}

interface ObjectiveWithKRs {
  id: string;
  title: string;
  keyResults: KR[];
}

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE"];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DONE:        { bg: "rgba(39,174,96,0.12)",   color: "#27AE60", label: "Done" },
  IN_PROGRESS: { bg: "rgba(8,146,165,0.10)",  color: "#0892A5", label: "In Progress" },
  TODO:        { bg: "rgba(130,130,130,0.10)", color: "#828282", label: "To Do" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#ffffff", border: "1.5px solid #E8ECF4",
  borderRadius: 10, padding: "10px 14px", fontSize: 14,
  fontFamily: "inherit", color: "#0E1B3D", outline: "none",
};

export default function TaskTableClient({ tasks: initial }: { tasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initial);

  // Alignment dialog
  const [alignTask, setAlignTask] = useState<Task | null>(null);
  const [editAlignments, setEditAlignments] = useState<Alignment[]>([]);
  const [saving, setSaving] = useState(false);
  const [allObjectives, setAllObjectives] = useState<ObjectiveWithKRs[]>([]);
  const [selectedKrId, setSelectedKrId] = useState("");
  const [selectedKpiId, setSelectedKpiId] = useState("");
  const [manualPct, setManualPct] = useState(100);
  const [adding, setAdding] = useState(false);

  // Edit task dialog
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadObjectives() {
    const res = await fetch("/api/keyresults");
    if (res.ok) setAllObjectives(await res.json());
  }

  function openAlign(task: Task) {
    setAlignTask(task);
    setEditAlignments(task.alignments.map((a) => ({ ...a })));
    setSelectedKrId(""); setSelectedKpiId(""); setManualPct(100);
    loadObjectives();
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditStatus(task.status);
  }

  async function saveTaskDetails() {
    if (!editTask) return;
    setEditSaving(true);
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription, status: editStatus }),
    });
    setEditSaving(false);
    if (!res.ok) return;
    setTasks((prev) => prev.map((t) => t.id === editTask.id ? { ...t, title: editTitle, description: editDescription, status: editStatus } : t));
    setEditTask(null);
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    setDeleting(true);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setDeleting(false);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditTask(null);
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }

  async function saveOverrides() {
    if (!alignTask) return;
    setSaving(true);
    await Promise.all(
      editAlignments.map((a) =>
        fetch(`/api/alignments/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contribution: a.contribution }),
        })
      )
    );
    setSaving(false);
    setTasks((prev) => prev.map((t) => (t.id === alignTask.id ? { ...t, alignments: editAlignments } : t)));
    setAlignTask(null);
    router.refresh();
  }

  async function removeAlignment(alignmentId: string) {
    await fetch(`/api/alignments/${alignmentId}`, { method: "DELETE" });
    setEditAlignments((prev) => prev.filter((a) => a.id !== alignmentId));
    setTasks((prev) =>
      prev.map((t) =>
        t.id === alignTask?.id ? { ...t, alignments: t.alignments.filter((a) => a.id !== alignmentId) } : t
      )
    );
  }

  async function addManualAlignment() {
    if (!alignTask || !selectedKrId) return;
    setAdding(true);
    const res = await fetch(`/api/tasks/${alignTask.id}/alignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: selectedKrId, kpiId: selectedKpiId || null, contribution: manualPct }),
    });
    setAdding(false);
    if (!res.ok) return;
    const newAlignment = await res.json();
    setEditAlignments((prev) => [...prev, newAlignment]);
    setTasks((prev) =>
      prev.map((t) => t.id === editTask!.id ? { ...t, alignments: [...t.alignments, newAlignment] } : t)
    );
    setSelectedKrId(""); setSelectedKpiId(""); setManualPct(100);
  }

  const selectedKr = allObjectives.flatMap((o) => o.keyResults).find((kr) => kr.id === selectedKrId);

  if (tasks.length === 0) {
    return (
      <div className="okra-card" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#828282" }}>No tasks yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="okra-card" style={{ overflow: "hidden" }}>
        <table className="okra-table">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Task</th>
              <th style={{ width: "28%" }}>Top Alignment</th>
              <th style={{ width: "25%" }}>Objective</th>
              <th style={{ width: "13%" }}>Status</th>
              <th style={{ width: "12%", textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const top = task.alignments[0];
              const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.TODO;
              return (
                <tr key={task.id}>
                  <td>
                    <p style={{ fontWeight: 600, color: "#0E1B3D", fontSize: 13 }}>{task.title}</p>
                    {task.description && (
                      <p style={{ fontSize: 11, color: "#828282", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td>
                    {top ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 500,
                          background: "#F4F7FE",
                          border: "1px solid #E8ECF4",
                          borderRadius: 10,
                          padding: "4px 10px",
                          color: "#0E1B3D",
                          wordBreak: "break-word",
                        }}
                      >
                        {top.kpi?.title ?? top.keyResult.title}
                        {top.keyResult.type !== "COUNT" && (
                          <span style={{ color: "#828282" }}>
                            {" "}· {top.contribution}%
                          </span>
                        )}
                        {top.isOverridden && <span style={{ color: "#0892A5" }}> ✎</span>}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#C8D0DC" }}>No alignment</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "#828282", display: "block" }}>
                      {top?.keyResult.objective.title ?? "—"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className="status-badge"
                      style={{
                        background: s.bg,
                        color: s.color,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 999,
                        outline: "none",
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <button
                        onClick={() => openEdit(task)}
                        style={{ fontSize: 12, color: "#0892A5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openAlign(task)}
                        style={{ fontSize: 12, color: "#828282", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
                      >
                        Align
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit task dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: 15, fontWeight: 700, color: "#0E1B3D" }}>Edit Task</DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
            <div>
              <label className="okra-label">Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="okra-label">Description</label>
              <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div>
              <label className="okra-label">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={inputStyle}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
              <button
                onClick={() => { if (confirm("Delete this task?")) deleteTask(editTask!.id); }}
                disabled={deleting}
                style={{ fontSize: 12, color: "#EB5757", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                {deleting ? "Deleting…" : "Delete task"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditTask(null)} className="btn-outline" style={{ borderRadius: 10, padding: "8px 16px" }}>Cancel</button>
                <button onClick={saveTaskDetails} disabled={editSaving} className="btn-primary" style={{ borderRadius: 10, padding: "8px 16px" }}>
                  {editSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alignment manager dialog */}
      <Dialog open={!!alignTask} onOpenChange={() => setAlignTask(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontSize: 15, fontWeight: 700, color: "#0E1B3D" }}>Manage Alignment</DialogTitle>
            <p style={{ fontSize: 13, color: "#828282", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alignTask?.title}</p>
          </DialogHeader>

          <div style={{ overflowY: "auto", maxHeight: "60vh", paddingRight: 4, display: "flex", flexDirection: "column", gap: 16 }}>
            {editAlignments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282" }}>
                  Current alignments
                </p>
                {editAlignments.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0E1B3D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.kpi?.title ?? a.keyResult.title}
                        </p>
                        <p style={{ fontSize: 11, color: "#828282", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.keyResult.objective.title}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {a.keyResult.type === "COUNT" ? (
                          <span style={{ fontSize: 13, color: "#828282" }}>1 unit</span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#EB5757", width: 36, textAlign: "right" }}>{a.contribution}%</span>
                        )}
                        <button onClick={() => removeAlignment(a.id)} style={{ fontSize: 12, color: "#EB5757", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                    {a.keyResult.type !== "COUNT" && (
                      <Slider
                        value={[a.contribution]}
                        min={0} max={100} step={5}
                        onValueChange={(value) => {
                          const num = Array.isArray(value) ? value[0] : value as number;
                          setEditAlignments((prev) => prev.map((x, j) => (j === i ? { ...x, contribution: num } : x)));
                        }}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={saveOverrides}
                  disabled={saving}
                  className="btn-primary"
                  style={{ justifyContent: "center", borderRadius: 10 }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}

            <div style={{ paddingTop: editAlignments.length > 0 ? 16 : 0, borderTop: editAlignments.length > 0 ? "1px solid #F2F2F2" : "none" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282", marginBottom: 12 }}>
                Add alignment manually
              </p>

              {allObjectives.length === 0 ? (
                <p style={{ fontSize: 12, color: "#828282" }}>Loading…</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label className="okra-label">Key result</label>
                    <select
                      value={selectedKrId}
                      onChange={(e) => { setSelectedKrId(e.target.value); setSelectedKpiId(""); }}
                      className="okra-input"
                    >
                      <option value="">Select a key result…</option>
                      {allObjectives.map((obj) => (
                        <optgroup key={obj.id} label={obj.title}>
                          {obj.keyResults.map((kr) => (
                            <option key={kr.id} value={kr.id}>{kr.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {selectedKr && selectedKr.kpis.length > 0 && (
                    <div>
                      <label className="okra-label">KPI <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                      <select
                        value={selectedKpiId}
                        onChange={(e) => setSelectedKpiId(e.target.value)}
                        className="okra-input"
                      >
                        <option value="">None (align to KR only)</option>
                        {selectedKr.kpis.map((kpi) => (
                          <option key={kpi.id} value={kpi.id}>{kpi.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedKr?.type === "COUNT" ? (
                    <p style={{ fontSize: 12, color: "#828282", background: "#F4F7FE", borderRadius: 8, padding: "10px 14px" }}>
                      Contributes <strong>1 unit</strong> toward target
                    </p>
                  ) : selectedKrId ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label className="okra-label" style={{ marginBottom: 0 }}>Contribution</label>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#EB5757" }}>{manualPct}%</span>
                      </div>
                      <Slider
                        value={[manualPct]}
                        min={5} max={100} step={5}
                        onValueChange={(value) => {
                          const num = Array.isArray(value) ? value[0] : value as number;
                          setManualPct(num);
                        }}
                      />
                    </div>
                  ) : null}

                  <button
                    onClick={addManualAlignment}
                    disabled={!selectedKrId || adding}
                    className="btn-outline"
                    style={{ justifyContent: "center", borderRadius: 10 }}
                  >
                    {adding ? "Adding…" : "+ Add alignment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
