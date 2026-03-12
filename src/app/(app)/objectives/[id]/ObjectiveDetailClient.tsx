"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KPI { id: string; title: string; keywords: string; description: string | null; order: number }
interface Alignment { id: string; task: { id: string; title: string; status: string }; kpi: { title: string } | null; contribution: number; isOverridden: boolean }
interface KR {
  id: string; title: string; description: string | null;
  type: string; targetValue: number; unit: string | null;
  kpis: KPI[]; alignments: Alignment[];
  progress: number; progressPct: number;
}
interface Objective { id: string; title: string; description: string | null; status: string }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DONE:        { bg: "rgba(39,174,96,0.12)",   color: "#27AE60", label: "Done" },
  IN_PROGRESS: { bg: "rgba(8,146,165,0.10)",  color: "#0892A5", label: "In Progress" },
  TODO:        { bg: "rgba(130,130,130,0.10)", color: "#828282", label: "To Do" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#ffffff", border: "1.5px solid #E8ECF4", borderRadius: 10,
  padding: "9px 13px", fontSize: 13, fontFamily: "inherit", color: "#0E1B3D", outline: "none",
};

function SortableKR({ kr, children }: { kr: KR; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kr.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, display: "flex", gap: 8 }}>
      <button
        {...attributes} {...listeners}
        suppressHydrationWarning
        style={{ display: "flex", alignItems: "flex-start", paddingTop: 20, paddingLeft: 4, paddingRight: 4, color: "#C8D0DC", cursor: "grab", flexShrink: 0, touchAction: "none", background: "none", border: "none" }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} />
      </button>
      <div className="okra-card" style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function SortableKPI({ kpi }: { kpi: KPI }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kpi.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1,
        display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#0E1B3D",
        background: "#F4F7FE", borderRadius: 8, padding: "8px 12px",
      }}
    >
      <button
        {...attributes} {...listeners}
        suppressHydrationWarning
        style={{ color: "#C8D0DC", cursor: "grab", flexShrink: 0, marginTop: 1, touchAction: "none", background: "none", border: "none" }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={12} />
      </button>
      <span style={{ fontWeight: 600 }}>{kpi.title}</span>
      <span style={{ color: "#B0BAC9" }}>·</span>
      <span style={{ color: "#828282", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kpi.keywords}</span>
    </div>
  );
}

export default function ObjectiveDetailClient({
  objective: initialObjective,
  keyResultsWithProgress,
}: {
  objective: Objective;
  keyResultsWithProgress: KR[];
}) {
  const router = useRouter();
  const [krs, setKrs] = useState(keyResultsWithProgress);
  const [objective, setObjective] = useState(initialObjective);

  const [editingObjective, setEditingObjective] = useState(false);
  const [objTitle, setObjTitle] = useState(objective.title);
  const [objDesc, setObjDesc] = useState(objective.description ?? "");
  const [objSaving, setObjSaving] = useState(false);

  const [showKrForm, setShowKrForm] = useState(false);
  const [krTitle, setKrTitle] = useState("");
  const [krTarget, setKrTarget] = useState("");
  const [krUnit, setKrUnit] = useState("");
  const [krType, setKrType] = useState<"PERCENTAGE" | "COUNT">("PERCENTAGE");
  const [krSaving, setKrSaving] = useState(false);

  const [editingKr, setEditingKr] = useState<string | null>(null);
  const [editKrTitle, setEditKrTitle] = useState("");
  const [editKrTarget, setEditKrTarget] = useState("");
  const [editKrUnit, setEditKrUnit] = useState("");
  const [editKrSaving, setEditKrSaving] = useState(false);

  const [kpiFormOpen, setKpiFormOpen] = useState<string | null>(null);
  const [kpiTitle, setKpiTitle] = useState("");
  const [kpiKeywords, setKpiKeywords] = useState("");
  const [kpiDesc, setKpiDesc] = useState("");
  const [kpiSaving, setKpiSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function saveObjective() {
    if (!objTitle.trim()) return;
    setObjSaving(true);
    const res = await fetch(`/api/objectives/${objective.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: objTitle, description: objDesc }),
    });
    setObjSaving(false);
    if (res.ok) { setObjective((prev) => ({ ...prev, title: objTitle, description: objDesc || null })); setEditingObjective(false); }
  }

  async function deleteObjective() {
    if (!confirm(`Delete objective "${objective.title}"? This will also remove all key results and KPIs.`)) return;
    await fetch(`/api/objectives/${objective.id}`, { method: "DELETE" });
    router.push("/objectives");
  }

  async function addKeyResult() {
    if (!krTitle || !krTarget) return;
    setKrSaving(true);
    const res = await fetch(`/api/objectives/${objective.id}/keyresults`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: krTitle, targetValue: krTarget, unit: krUnit, type: krType }),
    });
    setKrSaving(false);
    if (res.ok) {
      const newKr = await res.json();
      setKrs((prev) => [...prev, { ...newKr, kpis: [], alignments: [], progress: 0, progressPct: 0 }]);
      setKrTitle(""); setKrTarget(""); setKrUnit(""); setKrType("PERCENTAGE"); setShowKrForm(false);
    }
  }

  function openEditKr(kr: KR) {
    setEditingKr(kr.id); setEditKrTitle(kr.title);
    setEditKrTarget(String(kr.targetValue)); setEditKrUnit(kr.unit ?? "");
  }

  async function saveKr(krId: string) {
    if (!editKrTitle.trim()) return;
    setEditKrSaving(true);
    const res = await fetch(`/api/keyresults/${krId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editKrTitle, targetValue: editKrTarget, unit: editKrUnit }),
    });
    setEditKrSaving(false);
    if (res.ok) {
      setKrs((prev) => prev.map((kr) => kr.id === krId ? { ...kr, title: editKrTitle, targetValue: Number(editKrTarget), unit: editKrUnit || null } : kr));
      setEditingKr(null);
    }
  }

  async function deleteKr(krId: string, title: string) {
    if (!confirm(`Delete key result "${title}"?`)) return;
    const res = await fetch(`/api/keyresults/${krId}`, { method: "DELETE" });
    if (res.ok) setKrs((prev) => prev.filter((kr) => kr.id !== krId));
  }

  function handleKrDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setKrs((prev) => {
      const oldIndex = prev.findIndex((kr) => kr.id === active.id);
      const newIndex = prev.findIndex((kr) => kr.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      fetch("/api/keyresults/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: reordered.map((kr) => kr.id) }) });
      return reordered;
    });
  }

  function handleKpiDragEnd(krId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setKrs((prev) => prev.map((kr) => {
      if (kr.id !== krId) return kr;
      const oldIndex = kr.kpis.findIndex((k) => k.id === active.id);
      const newIndex = kr.kpis.findIndex((k) => k.id === over.id);
      const reordered = arrayMove(kr.kpis, oldIndex, newIndex);
      fetch("/api/kpis/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: reordered.map((k) => k.id) }) });
      return { ...kr, kpis: reordered };
    }));
  }

  async function addKPI(krId: string) {
    if (!kpiTitle || !kpiKeywords) return;
    setKpiSaving(true);
    const res = await fetch(`/api/objectives/${objective.id}/kpis`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: krId, title: kpiTitle, description: kpiDesc, keywords: kpiKeywords }),
    });
    setKpiSaving(false);
    if (res.ok) {
      const newKpi = await res.json();
      setKrs((prev) => prev.map((kr) => kr.id === krId ? { ...kr, kpis: [...kr.kpis, newKpi] } : kr));
      setKpiTitle(""); setKpiKeywords(""); setKpiDesc(""); setKpiFormOpen(null);
    }
  }

  const overallProgress = krs.length > 0 ? Math.round(krs.reduce((sum, kr) => sum + kr.progressPct, 0) / krs.length) : 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/objectives" style={{ fontSize: 13, fontWeight: 600, color: "#0892A5", textDecoration: "none" }}>
          ← Objectives
        </Link>
      </div>

      {/* Objective header card */}
      <div className="okra-card" style={{ padding: 24, marginBottom: 20 }}>
        {editingObjective ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="okra-label">Objective title</label>
              <input style={inputStyle} value={objTitle} onChange={(e) => setObjTitle(e.target.value)} />
            </div>
            <div>
              <label className="okra-label">Description</label>
              <textarea style={{ ...inputStyle, resize: "none" }} rows={2} value={objDesc} onChange={(e) => setObjDesc(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveObjective} disabled={objSaving} className="btn-primary" style={{ borderRadius: 8, padding: "7px 16px" }}>
                {objSaving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditingObjective(false); setObjTitle(objective.title); setObjDesc(objective.description ?? ""); }} className="btn-outline" style={{ borderRadius: 8, padding: "7px 16px" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0E1B3D", letterSpacing: "-0.01em", marginBottom: 4 }}>
                {objective.title}
              </h1>
              {objective.description && (
                <p style={{ fontSize: 13, color: "#828282", marginBottom: 10 }}>{objective.description}</p>
              )}
              <div style={{ display: "flex", gap: 16 }}>
                <button onClick={() => setEditingObjective(true)} style={{ fontSize: 12, color: "#0892A5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                <button onClick={deleteObjective} style={{ fontSize: 12, color: "#EB5757", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#EB5757", letterSpacing: "-0.03em" }}>
                {overallProgress}%
              </span>
              <p style={{ fontSize: 11, color: "#828282" }}>overall</p>
            </div>
          </div>
        )}
        {!editingObjective && <Progress value={overallProgress} className="h-2 mt-4" />}
      </div>

      {/* Key Results section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0E1B3D" }}>Key Results</h2>
          <button onClick={() => setShowKrForm(!showKrForm)} className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            + Add key result
          </button>
        </div>

        {showKrForm && (
          <div className="okra-card" style={{ padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="okra-label">Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["PERCENTAGE", "COUNT"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setKrType(t)}
                    style={{
                      textAlign: "left", padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "all 0.12s",
                      background: krType === t ? "#0E1B3D" : "#F4F7FE",
                      border: `1.5px solid ${krType === t ? "#0E1B3D" : "#E8ECF4"}`,
                      color: krType === t ? "#ffffff" : "#828282",
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{t === "PERCENTAGE" ? "% Percentage" : "# Count"}</p>
                    <p style={{ fontSize: 11, color: krType === t ? "rgba(255,255,255,0.55)" : "#B0BAC9" }}>
                      {t === "PERCENTAGE" ? "Completion tracked by %" : "Each task = 1 unit"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="okra-label">Key result title *</label>
                <input style={inputStyle} placeholder={krType === "COUNT" ? "e.g. Publish 10 videos" : "e.g. Increase NPS score"} value={krTitle} onChange={(e) => setKrTitle(e.target.value)} />
              </div>
              <div>
                <label className="okra-label">{krType === "COUNT" ? "Target count *" : "Target value *"}</label>
                <input style={inputStyle} type="number" placeholder="10" value={krTarget} onChange={(e) => setKrTarget(e.target.value)} />
              </div>
              <div>
                <label className="okra-label">Unit</label>
                <input style={inputStyle} placeholder={krType === "COUNT" ? "videos…" : "%, $, pts…"} value={krUnit} onChange={(e) => setKrUnit(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addKeyResult} disabled={krSaving} className="btn-primary" style={{ borderRadius: 8, padding: "7px 16px" }}>{krSaving ? "Saving…" : "Save"}</button>
              <button onClick={() => setShowKrForm(false)} className="btn-outline" style={{ borderRadius: 8, padding: "7px 16px" }}>Cancel</button>
            </div>
          </div>
        )}

        {krs.length === 0 && !showKrForm && (
          <p style={{ fontSize: 13, color: "#828282" }}>No key results yet. Add one above.</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleKrDragEnd}>
          <SortableContext items={krs.map((kr) => kr.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {krs.map((kr) => (
                <SortableKR key={kr.id} kr={kr}>
                  <div style={{ padding: 20 }}>
                    {editingKr === kr.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label className="okra-label">Title</label>
                            <input style={{ ...inputStyle, fontSize: 12 }} value={editKrTitle} onChange={(e) => setEditKrTitle(e.target.value)} />
                          </div>
                          <div>
                            <label className="okra-label">Target value</label>
                            <input style={{ ...inputStyle, fontSize: 12 }} type="number" value={editKrTarget} onChange={(e) => setEditKrTarget(e.target.value)} />
                          </div>
                          <div>
                            <label className="okra-label">Unit</label>
                            <input style={{ ...inputStyle, fontSize: 12 }} value={editKrUnit} onChange={(e) => setEditKrUnit(e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => saveKr(kr.id)} disabled={editKrSaving} className="btn-primary" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>{editKrSaving ? "Saving…" : "Save"}</button>
                          <button onClick={() => setEditingKr(null)} className="btn-outline" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0E1B3D", marginBottom: 2 }}>{kr.title}</p>
                          {kr.description && <p style={{ fontSize: 12, color: "#828282" }}>{kr.description}</p>}
                          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                            <button onClick={() => openEditKr(kr)} style={{ fontSize: 11, color: "#0892A5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                            <button onClick={() => deleteKr(kr.id, kr.title)} style={{ fontSize: 11, color: "#EB5757", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                          <span style={{ fontSize: 13, color: "#828282" }}>
                            {kr.type === "COUNT"
                              ? `${Math.round(kr.progress)} / ${kr.targetValue} ${kr.unit ?? ""}`
                              : `${kr.progress.toFixed(1)} / ${kr.targetValue} ${kr.unit ?? ""}`}
                          </span>
                          <span
                            style={{
                              marginLeft: 6, fontSize: 10, fontWeight: 600, fontFamily: "monospace",
                              padding: "2px 6px", borderRadius: 4,
                              background: kr.type === "COUNT" ? "rgba(8,146,165,0.10)" : "rgba(130,130,130,0.10)",
                              color: kr.type === "COUNT" ? "#0892A5" : "#828282",
                            }}
                          >
                            {kr.type === "COUNT" ? "#" : "%"}
                          </span>
                        </div>
                      </div>
                    )}

                    <Progress value={kr.progressPct} className="h-1.5" />
                    <p style={{ fontSize: 11, color: "#828282", marginTop: 4 }}>{kr.progressPct}% complete</p>

                    {/* KPIs */}
                    {kr.kpis.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282", marginBottom: 8 }}>KPIs</p>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleKpiDragEnd(kr.id, e)}>
                          <SortableContext items={kr.kpis.map((k) => k.id)} strategy={verticalListSortingStrategy}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {kr.kpis.map((kpi) => <SortableKPI key={kpi.id} kpi={kpi} />)}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}

                    {/* KPI add form */}
                    {kpiFormOpen === kr.id ? (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F2F2F2", display: "flex", flexDirection: "column", gap: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282" }}>New KPI</p>
                        <div>
                          <label className="okra-label">KPI title *</label>
                          <input style={{ ...inputStyle, fontSize: 12 }} placeholder="e.g. Enterprise sales" value={kpiTitle} onChange={(e) => setKpiTitle(e.target.value)} />
                        </div>
                        <div>
                          <label className="okra-label">Keywords * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#B0BAC9" }}>(comma-separated, used for alignment)</span></label>
                          <input style={{ ...inputStyle, fontSize: 12 }} placeholder="enterprise, sales, deal, contract" value={kpiKeywords} onChange={(e) => setKpiKeywords(e.target.value)} />
                        </div>
                        <div>
                          <label className="okra-label">Description</label>
                          <input style={{ ...inputStyle, fontSize: 12 }} placeholder="Optional" value={kpiDesc} onChange={(e) => setKpiDesc(e.target.value)} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => addKPI(kr.id)} disabled={kpiSaving} className="btn-primary" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>{kpiSaving ? "Saving…" : "Save KPI"}</button>
                          <button onClick={() => setKpiFormOpen(null)} className="btn-outline" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setKpiFormOpen(kr.id)} style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "#0892A5", background: "none", border: "none", cursor: "pointer" }}>
                        + Add KPI
                      </button>
                    )}

                    {/* Aligned tasks */}
                    {kr.alignments.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F2F2F2" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282", marginBottom: 8 }}>Aligned tasks</p>
                        {kr.alignments.map((a) => {
                          const s = STATUS_STYLE[a.task.status] ?? STATUS_STYLE.TODO;
                          return (
                            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F8F9FB" }}>
                              <span style={{ fontSize: 12, color: "#0E1B3D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.task.title}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                                <span style={{ fontSize: 11, color: "#828282" }}>{kr.type === "COUNT" ? "1 unit" : `${a.contribution}%`}</span>
                                <span className="status-badge" style={{ background: s.bg, color: s.color, fontSize: 10 }}>{s.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SortableKR>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
