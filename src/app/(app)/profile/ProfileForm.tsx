"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#ffffff", border: "1.5px solid #E8ECF4",
  borderRadius: 10, padding: "10px 14px", fontSize: 14,
  fontFamily: "inherit", color: "#0E1B3D", outline: "none",
};

export default function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true); setNameMsg(null);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setNameSaving(false);
    if (res.ok) { setNameMsg({ ok: true, text: "Name updated successfully." }); router.refresh(); }
    else { const data = await res.json(); setNameMsg({ ok: false, text: data.error ?? "Failed to update name." }); }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault(); setPwMsg(null);
    if (newPassword !== confirmPassword) { setPwMsg({ ok: false, text: "Passwords do not match." }); return; }
    setPwSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    setPwSaving(false);
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwMsg({ ok: true, text: "Password updated successfully." }); }
    else { const data = await res.json(); setPwMsg({ ok: false, text: data.error ?? "Failed to update password." }); }
  }

  const MsgBanner = ({ msg }: { msg: { ok: boolean; text: string } }) => (
    <p style={{ fontSize: 13, fontWeight: 500, borderRadius: 10, padding: "10px 14px", background: msg.ok ? "rgba(39,174,96,0.10)" : "rgba(235,87,87,0.08)", color: msg.ok ? "#27AE60" : "#EB5757" }}>
      {msg.text}
    </p>
  );

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0E1B3D", letterSpacing: "-0.02em" }}>Profile</h1>
        <p style={{ fontSize: 13, color: "#828282", marginTop: 4 }}>Manage your account details</p>
      </div>

      {/* Display name */}
      <div className="okra-card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0E1B3D", marginBottom: 20 }}>Display Name</h2>
        <form onSubmit={handleNameSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="okra-label">Email</label>
            <input value={email} disabled style={{ ...inputStyle, background: "#F4F7FE", color: "#828282", cursor: "not-allowed" }} />
          </div>
          <div>
            <label className="okra-label">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>
          {nameMsg && <MsgBanner msg={nameMsg} />}
          <div>
            <button type="submit" disabled={nameSaving} className="btn-primary" style={{ borderRadius: 10, padding: "10px 20px" }}>
              {nameSaving ? "Saving…" : "Save name"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="okra-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0E1B3D", marginBottom: 20 }}>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { id: "cp", label: "Current password", value: currentPassword, setter: setCurrentPassword },
            { id: "np", label: "New password",     value: newPassword,     setter: setNewPassword },
            { id: "cfp", label: "Confirm new password", value: confirmPassword, setter: setConfirmPassword },
          ].map(({ id, label, value, setter }) => (
            <div key={id}>
              <label className="okra-label">{label}</label>
              <input id={id} type="password" value={value} onChange={(e) => setter(e.target.value)} required style={inputStyle} />
            </div>
          ))}
          {pwMsg && <MsgBanner msg={pwMsg} />}
          <div>
            <button type="submit" disabled={pwSaving} className="btn-primary" style={{ borderRadius: 10, padding: "10px 20px" }}>
              {pwSaving ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
