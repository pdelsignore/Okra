"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Suggestion { keyResultId: string; keyResultTitle: string; keyResultType: string; objectiveTitle: string; contribution: number }
interface KR { id: string; title: string; type: string; kpis: { id: string; title: string }[] }
interface ObjectiveWithKRs { id: string; title: string; keyResults: KR[] }
interface ManualAlignment { keyResultId: string; keyResultTitle: string; keyResultType: string; objectiveTitle: string; kpiId: string; kpiTitle: string; contribution: number }

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }) as T;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#ffffff", border: "1.5px solid #E8ECF4",
  borderRadius: 10, padding: "10px 14px", fontSize: 14,
  fontFamily: "inherit", color: "#0E1B3D", outline: "none",
};
const selectStyle: React.CSSProperties = { ...inputStyle };

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionPct, setSuggestionPct] = useState<number>(100);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [allObjectives, setAllObjectives] = useState<ObjectiveWithKRs[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualAlignments, setManualAlignments] = useState<ManualAlignment[]>([]);
  const [selectedKrId, setSelectedKrId] = useState("");
  const [selectedKpiId, setSelectedKpiId] = useState("");
  const [manualPct, setManualPct] = useState(100);

  useEffect(() => { fetch("/api/keyresults").then((r) => r.json()).then(setAllObjectives); }, []);

  const fetchPreview = useCallback(
    debounce(async (t: string, d: string) => {
      if (!t.trim()) { setSuggestions([]); return; }
      setPreviewLoading(true);
      const res = await fetch("/api/align/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t, description: d }) });
      setPreviewLoading(false);
      if (res.ok) { const data: Suggestion[] = await res.json(); setSuggestions(data); if (data.length > 0) setSuggestionPct(data[0].contribution); }
    }, 400), []
  );

  function onTitleChange(val: string) { setTitle(val); fetchPreview(val, description); }
  function onDescChange(val: string) { setDescription(val); fetchPreview(title, val); }

  const selectedKr = allObjectives.flatMap((o) => o.keyResults).find((kr) => kr.id === selectedKrId);
  const selectedObj = allObjectives.find((o) => o.keyResults.some((kr) => kr.id === selectedKrId));

  function addManualEntry() {
    if (!selectedKrId || !selectedKr) return;
    const kpi = selectedKr.kpis.find((k) => k.id === selectedKpiId);
    setManualAlignments([{ keyResultId: selectedKrId, keyResultTitle: selectedKr.title, keyResultType: selectedKr.type, objectiveTitle: selectedObj?.title ?? "", kpiId: kpi?.id ?? "", kpiTitle: kpi?.title ?? "", contribution: selectedKr.type === "COUNT" ? 1 : manualPct }]);
    setSelectedKrId(""); setSelectedKpiId(""); setManualPct(100);
  }
  function removeManualEntry(krId: string) { setManualAlignments((prev) => prev.filter((m) => m.keyResultId !== krId)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = { title, description };
    if (manualAlignments.length > 0) {
      body.manualAlignments = manualAlignments.map((m) => ({ keyResultId: m.keyResultId, kpiId: m.kpiId || null, contribution: m.contribution }));
    } else if (suggestions.length > 0 && suggestions[0].keyResultType === "PERCENTAGE") {
      body.manualAlignments = [{ keyResultId: suggestions[0].keyResultId, kpiId: null, contribution: suggestionPct }];
    }
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { setError("Failed to save task"); return; }
    router.push("/tasks");
  }

  const useManual = manualAlignments.length > 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/tasks" style={{ fontSize: 13, fontWeight: 600, color: "#3D7BFF", textDecoration: "none" }}>← Tasks</Link>
      </div>

      <div className="okra-card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0E1B3D", letterSpacing: "-0.01em", marginBottom: 24 }}>New Task</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="okra-label">Task title *</label>
            <input type="text" placeholder="e.g. Prepare demo for Acme Corp" value={title} onChange={(e) => onTitleChange(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label className="okra-label">Description</label>
            <textarea rows={3} placeholder="What are you working on?" value={description} onChange={(e) => onDescChange(e.target.value)} style={{ ...inputStyle, resize: "none" }} />
          </div>

          {/* Auto-alignment preview */}
          {!useManual && (suggestions.length > 0 || previewLoading) && (
            <div style={{ background: "rgba(61,123,255,0.05)", border: "1.5px solid rgba(61,123,255,0.15)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#3D7BFF" }}>
                {previewLoading ? "Finding alignment…" : "Suggested alignment"}
              </p>
              {suggestions.map((s) => (
                <div key={s.keyResultId} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1B3D" }}>{s.keyResultTitle}</span>
                      <span style={{ fontSize: 11, color: "#828282", marginLeft: 8 }}>{s.objectiveTitle}</span>
                    </div>
                    {s.keyResultType === "COUNT" ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(61,123,255,0.10)", color: "#3D7BFF", padding: "3px 8px", borderRadius: 6, fontFamily: "monospace" }}>1 unit</span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3D7BFF" }}>{suggestionPct}%</span>
                    )}
                  </div>
                  {s.keyResultType === "PERCENTAGE" && (
                    <input type="range" min={5} max={100} step={5} value={suggestionPct} onChange={(e) => setSuggestionPct(Number(e.target.value))} style={{ width: "100%", accentColor: "#3D7BFF" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Manual alignment */}
          <div style={{ border: "1.5px solid #E8ECF4", borderRadius: 12, padding: 16 }}>
            <button type="button" onClick={() => setShowManual(!showManual)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#828282", background: "none", border: "none", cursor: "pointer" }}>
              <span>Manual alignment {useManual ? `(${manualAlignments.length} set)` : "(override auto)"}</span>
              <span>{showManual ? "▲" : "▼"}</span>
            </button>

            {showManual && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
                {manualAlignments.map((m) => (
                  <div key={m.keyResultId} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, background: "rgba(61,123,255,0.06)", border: "1px solid rgba(61,123,255,0.15)", borderRadius: 10, padding: "10px 12px" }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0E1B3D" }}>{m.kpiTitle || m.keyResultTitle}</p>
                      <p style={{ fontSize: 11, color: "#828282" }}>{m.objectiveTitle} · {m.keyResultType === "COUNT" ? "1 unit" : `${m.contribution}%`}</p>
                    </div>
                    <button type="button" onClick={() => removeManualEntry(m.keyResultId)} style={{ fontSize: 12, color: "#EB5757", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>
                  </div>
                ))}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <select value={selectedKrId} onChange={(e) => { setSelectedKrId(e.target.value); setSelectedKpiId(""); }} style={selectStyle}>
                    <option value="">Select a key result…</option>
                    {allObjectives.map((obj) => (
                      <optgroup key={obj.id} label={obj.title}>
                        {obj.keyResults.map((kr) => (
                          <option key={kr.id} value={kr.id} disabled={!!manualAlignments.find((m) => m.keyResultId === kr.id)}>{kr.title}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {selectedKr && selectedKr.kpis.length > 0 && (
                    <select value={selectedKpiId} onChange={(e) => setSelectedKpiId(e.target.value)} style={selectStyle}>
                      <option value="">No specific KPI</option>
                      {selectedKr.kpis.map((kpi) => <option key={kpi.id} value={kpi.id}>{kpi.title}</option>)}
                    </select>
                  )}

                  {selectedKr?.type === "COUNT" ? (
                    <p style={{ fontSize: 12, color: "#828282", background: "#F4F7FE", borderRadius: 8, padding: "10px 12px" }}>
                      Contributes <strong>1 unit</strong> toward {selectedKr.title}
                    </p>
                  ) : selectedKrId ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input type="range" min={5} max={100} step={5} value={manualPct} onChange={(e) => setManualPct(Number(e.target.value))} style={{ flex: 1, accentColor: "#3D7BFF" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#3D7BFF", width: 32, textAlign: "right" }}>{manualPct}%</span>
                    </div>
                  ) : null}

                  <button type="button" onClick={addManualEntry} disabled={!selectedKrId} className="btn-outline" style={{ justifyContent: "center", borderRadius: 10, opacity: !selectedKrId ? 0.5 : 1 }}>
                    + Add alignment
                  </button>
                </div>

                {useManual && (
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#3D7BFF" }}>Manual alignment will override auto-detection.</p>
                )}
              </div>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: "#EB5757", background: "rgba(235,87,87,0.08)", borderRadius: 10, padding: "10px 14px" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ borderRadius: 10, padding: "10px 20px" }}>{saving ? "Saving…" : "Save task"}</button>
            <button type="button" onClick={() => router.back()} className="btn-outline" style={{ borderRadius: 10, padding: "10px 20px" }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
