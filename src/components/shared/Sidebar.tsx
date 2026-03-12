"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  AlertTriangle,
  FileText,
  LogOut,
  UserCircle,
} from "lucide-react";

const nav = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/objectives", label: "Objectives",  icon: Target },
  { href: "/tasks",      label: "Tasks",       icon: CheckSquare },
  { href: "/gaps",       label: "Gaps",        icon: AlertTriangle },
  { href: "/report",     label: "Report",      icon: FileText },
  { href: "/profile",    label: "Profile",     icon: UserCircle },
];

export default function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 240,
        background: "#ffffff",
        borderRight: "1px solid #F2F2F2",
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-5" style={{ borderBottom: "1px solid #F2F2F2" }}>
        <Image
          src="/okra-logo.png"
          alt="Okra"
          width={120}
          height={48}
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "#3D7BFF" : "#828282",
                background: active ? "#E9F0FF" : "transparent",
                textDecoration: "none",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "#F4F7FE";
                  (e.currentTarget as HTMLElement).style.color = "#0E1B3D";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#828282";
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid #F2F2F2" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#E9F0FF", color: "#3D7BFF" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#0E1B3D" }}>
              {user.name}
            </p>
            <p className="truncate" style={{ fontSize: 11, color: "#828282" }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 12, color: "#B0BAC9", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#828282"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#B0BAC9"; }}
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
