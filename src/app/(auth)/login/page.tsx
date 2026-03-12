"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F4F7FE" }}>
      {/* Left: brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{ width: 420, background: "#0E1B3D", padding: "48px 40px", flexShrink: 0 }}
      >
        <div />
        <div>
          <Image src="/okra-logo.png" alt="Okra" width={120} height={48} style={{ objectFit: "contain", marginBottom: 40 }} />
          <p style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Align your work<br />to what matters.
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Okra connects your daily tasks to your biggest objectives — automatically, using intelligent alignment.
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
          <div className="mb-8 lg:hidden">
            <Image src="/okra-logo.png" alt="Okra" width={120} height={48} style={{ objectFit: "contain" }} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0E1B3D", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "#828282", marginBottom: 28 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                className="okra-input"
              />
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#828282" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#0892A5", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
