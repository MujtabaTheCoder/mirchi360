import React, { useState, useMemo } from "react";
import { Flame, LogOut, Menu, X, Calendar } from "lucide-react";
import { useApp, getCurrentShift } from "../../lib/store";
import { SEED_DATA } from "../../lib/initialData";

const getBranchById = (branchId) =>
  SEED_DATA.branches.find((b) => b.id === branchId) || SEED_DATA.branches[0];

export const StaffShell = ({
  title,
  badge,
  icon: Icon,
  iconWrapClass = "bg-rose-600/20 border-rose-500/30 text-rose-500",
  actions,
  children,
  hideBranchSelector = false
}) => {
  const { selectedBranch, setSelectedBranch, currentSession, logoutStaff } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shift = getCurrentShift();

  const { displayBranch, canChangeBranch } = useMemo(() => {
    const sessionBranchId = currentSession?.branchId;
    const isAdmin = currentSession?.role === "admin";
    if (sessionBranchId && !isAdmin) {
      return {
        displayBranch: getBranchById(sessionBranchId),
        canChangeBranch: false
      };
    }
    return {
      displayBranch: selectedBranch,
      canChangeBranch: !hideBranchSelector && isAdmin
    };
  }, [currentSession, selectedBranch, hideBranchSelector]);

  const branchSelect = canChangeBranch ? (
    <label className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
      <span className="text-[11px] text-slate-400 font-semibold shrink-0">Branch</span>
      <select
        value={selectedBranch.id}
        onChange={(e) => {
          const br = SEED_DATA.branches.find((b) => b.id === e.target.value);
          if (br) setSelectedBranch(br);
        }}
        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-rose-400 font-bold focus:outline-none w-full sm:max-w-[160px]"
      >
        {SEED_DATA.branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  ) : null;

  const branchChip = (
    <span className="inline-flex items-center gap-1 bg-slate-950 text-rose-400 border border-rose-900/60 px-2.5 py-1 rounded-md font-black text-[11px] whitespace-nowrap">
      {displayBranch.name}
    </span>
  );

  const shiftChip = (
    <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-400 border border-amber-800 px-2 py-1 rounded-md font-bold text-[11px] whitespace-nowrap">
      <Calendar className="w-3 h-3" />
      {shift.shiftName}
    </span>
  );

  const logoutBtn = (
    <button
      onClick={() => {
        logoutStaff();
        setMobileOpen(false);
      }}
      className="inline-flex items-center justify-center gap-1.5 w-full lg:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 min-h-[44px]"
    >
      <LogOut className="w-3.5 h-3.5" />
      Logout
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 shadow-xl overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${iconWrapClass}`}>
                {Icon ? <Icon className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black text-white uppercase tracking-wide truncate">{title}</h1>
                  {badge}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentSession?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {branchChip}
              {branchSelect}
              {shiftChip}
              {actions && <div className="w-full lg:w-auto">{actions}</div>}
              {logoutBtn}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconWrapClass}`}>
                  {Icon ? <Icon className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white uppercase truncate">{title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentSession?.name}</div>
                </div>
              </div>
              {branchChip}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
            {mobileOpen && (
              <div className="flex flex-col gap-3 pb-1 animate-in slide-in-from-top duration-200">
                {branchSelect}
                {shiftChip}
                {actions && <div className="w-full">{actions}</div>}
                {logoutBtn}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="p-3 sm:p-4 space-y-5 max-w-7xl mx-auto w-full overflow-x-hidden">{children}</div>
    </div>
  );
};
