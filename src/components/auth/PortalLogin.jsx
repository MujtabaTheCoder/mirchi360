import React, { useState, useEffect } from "react";
import { ChefHat, ShieldCheck, Crown, Lock, User, ShieldAlert, CheckCircle2, Flame, LogOut } from "lucide-react";
import { useApp } from "../../lib/store";
import { useNavigate } from "react-router-dom";

const PORTAL = {
  kitchen: {
    title: "Kitchen Portal",
    subtitle: "Enter the 4-digit Kitchen PIN. Access is limited to the KDS screen.",
    icon: ChefHat,
    accent: "text-rose-500",
    wrap: "bg-rose-950/80 border-rose-800",
    button: "bg-rose-600 hover:bg-rose-500 text-white"
  },
  manager: {
    title: "Manager Portal",
    subtitle: "Enter Manager credentials / PIN. Access is limited to the Supervisory panel.",
    icon: ShieldCheck,
    accent: "text-amber-400",
    wrap: "bg-amber-950/80 border-amber-800",
    button: "bg-amber-500 hover:bg-amber-400 text-slate-950"
  },
  admin: {
    title: "Super Admin Portal",
    subtitle: "Enter Super Admin username and password. Access is limited to the Control Center.",
    icon: Crown,
    accent: "text-rose-400",
    wrap: "bg-rose-950/80 border-rose-800",
    button: "bg-rose-600 hover:bg-rose-500 text-white"
  }
};

export const PortalLogin = ({ expectedRole, blockedSession }) => {
  const { loginStaff, logoutStaff, selectedBranch, currentSession } = useApp();
  const cfg = PORTAL[expectedRole];
  const Icon = cfg.icon;
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (successMsg && currentSession && currentSession.role === expectedRole) {
      const t = setTimeout(() => window.location.reload(), 500);
      return () => clearTimeout(t);
    }
  }, [successMsg, currentSession, expectedRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setBusy(true);
    const res = await loginStaff({
      role: expectedRole,
      username,
      pin,
      password: pin,
      branchId: selectedBranch?.id
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setSuccessMsg(`Welcome, ${res.user.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-x-hidden space-y-4">
      {blockedSession && (
        <div className="w-full max-w-md bg-slate-900/70 border border-amber-800/50 rounded-3xl p-4 text-sm space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">Role Mismatch</h3>
              <p className="text-slate-300 text-xs">
                You are signed in as <strong className="text-white">{blockedSession.name}</strong> ({blockedSession.role}).
                This portal requires <strong className="text-amber-300">{expectedRole}</strong> access.
              </p>
              <p className="text-slate-400 text-[11px]">
                Enter {expectedRole} credentials below to switch sessions on this device, or fully logout first.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { logoutStaff(); window.location.reload(); }}
            className="w-full px-4 py-2 text-[11px] font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Fully Logout First
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Mirchi 360</div>
              <div className={`flex items-center gap-2 font-bold ${cfg.accent}`}>
                <Icon className="w-5 h-5" />
                <h1 className="text-lg text-slate-100">{cfg.title}</h1>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">{cfg.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs rounded-2xl flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {expectedRole !== "kitchen" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {expectedRole === "admin" ? "Username" : "Username (optional)"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={expectedRole === "admin" ? "Super Admin username" : "e.g. mgr_def"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {expectedRole === "admin" ? "Password" : "4-digit PIN"}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                inputMode={expectedRole === "admin" ? "text" : "numeric"}
                autoComplete={expectedRole === "admin" ? "current-password" : "one-time-code"}
                placeholder={expectedRole === "admin" ? "Password" : "••••"}
                value={pin}
                maxLength={expectedRole === "admin" ? 32 : 4}
                onChange={(e) =>
                  setPin(expectedRole === "admin" ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500 tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`w-full py-3 text-xs font-bold rounded-xl shadow-lg min-h-[44px] disabled:opacity-60 ${cfg.button}`}
          >
            {busy ? "Authenticating…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};
