"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F4F7FE" }}>
      {/* Left: brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{ width: 420, background: "#0E1B3D", padding: "48px 40px", flexShrink: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/okra-logo.png" alt="Okra" width={40} height={40} style={{ borderRadius: 10 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Okra
          </span>
        </div>
        <div>
          <p style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Start working<br />with purpose.
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Create your account and begin aligning every task to the outcomes that matter most.
          </p>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Okra
        </p>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Image src="/okra-logo.png" alt="Okra" width={36} height={36} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: "#0E1B3D" }}>Okra</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0E1B3D", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: "#828282", marginBottom: 28 }}>
            Free to use — no credit card required
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="okra-label">Full name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="okra-input"
              />
            </div>
            <div>
              <label className="okra-label">Email address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="okra-input"
              />
            </div>
            <div>
              <label className="okra-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="okra-input"
              />
              <p style={{ fontSize: 11, color: "#B0BAC9", marginTop: 4 }}>Minimum 8 characters</p>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#EB5757", background: "rgba(235,87,87,0.08)", borderRadius: 10, padding: "10px 14px" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ justifyContent: "center", padding: "12px 18px", borderRadius: 12, marginTop: 4 }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#828282" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#0892A5", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
