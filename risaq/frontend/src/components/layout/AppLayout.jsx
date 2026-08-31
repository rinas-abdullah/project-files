import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "لوحة التحكم", icon: "🛰️" },
  { to: "/labs", label: "المختبرات", icon: "🧪" },
  { to: "/reports", label: "التقارير", icon: "📊" },
  { to: "/achievements", label: "الإنجازات", icon: "🏆" },
  { to: "/leaderboard", label: "المتصدرون", icon: "📈" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-l border-risaq-border bg-risaq-panel/60 backdrop-blur px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <span className="text-2xl">🛡️</span>
          <div>
            <div className="font-bold text-lg leading-none">رِسَاق</div>
            <div className="text-[10px] text-risaq-muted mt-1">RISAQ Cyber Training</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-risaq-primary/10 text-risaq-primary border border-risaq-primary/30"
                    : "text-risaq-muted hover:text-risaq-text hover:bg-risaq-panel2"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-risaq-border pt-4 mt-4">
          <div className="text-sm font-semibold truncate">{user?.name}</div>
          <div className="text-xs text-risaq-muted truncate mb-3">{user?.email}</div>
          <button onClick={handleLogout} className="btn-secondary w-full text-xs py-2">
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-risaq-border px-4 py-3 bg-risaq-panel/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold">رِسَاق</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-risaq-muted">
            خروج
          </button>
        </header>

        <nav className="md:hidden flex overflow-x-auto gap-2 px-4 py-2 border-b border-risaq-border bg-risaq-panel/40">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isActive ? "bg-risaq-primary/10 text-risaq-primary" : "text-risaq-muted"
                }`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
