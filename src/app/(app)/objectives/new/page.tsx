"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#ffffff", border: "1.5px solid #E8ECF4",
  borderRadius: 10, padding: "10px 14px", fontSize: 14,
  fontFamily: "inherit", color: "#0E1B3D", outline: "none",
};

export default function NewObjectivePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/objectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setLoading(false);
    if (!res.ok) { setError("Failed to create objective"); return; }
    const obj = await res.json();
    router.push(`/objectives/${obj.id}`);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/objectives" style={{ fontSize: 13, fontWeight: 600, color: "#0892A5", textDecoration: "none" }}>
          ← Objectives
        </Link>
      </div>

      <div className="okra-card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0E1B3D", letterSpacing: "-0.01em", marginBottom: 24 }}>
          New Objective
        </h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="okra-label">Objective title *</label>
            <input type="text" placeholder="e.g. Grow revenue by 20% this year" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label className="okra-label">Description</label>
            <textarea placeholder="What does success look like?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#EB5757", background: "rgba(235,87,87,0.08)", borderRadius: 10, padding: "10px 14px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ borderRadius: 10, padding: "10px 20px" }}>
              {loading ? "Creating…" : "Create objective"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-outline" style={{ borderRadius: 10, padding: "10px 20px" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
