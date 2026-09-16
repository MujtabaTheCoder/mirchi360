import React from 'react';
import { ChefHat, ShieldCheck, Crown, ArrowRight, Flame } from 'lucide-react';
import { ShiftDisplay } from '../shared/ShiftDisplay';

export const StaffPortal = () => {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 space-y-6 font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 pt-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-2xl shadow-rose-600/30">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-white tracking-wide">MIRCHI 360</h1>
            <p className="text-sm text-rose-400 font-semibold">Staff Portal Access</p>
          </div>
        </div>
        <div className="flex justify-center">
          <ShiftDisplay />
        </div>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Select your role to login. Each portal has separate access credentials.
        </p>
      </div>

      {/* Portal Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kitchen Portal */}
        <div className="bg-slate-900 border border-rose-800/50 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Kitchen Portal</h2>
              <p className="text-xs text-rose-400">KDS Access — Kitchen Display System</p>
            </div>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-slate-300">Enter your 4-digit Kitchen PIN to access the Kitchen Display System.</p>
            <p className="text-[11px] text-slate-500">Contact your branch manager if you need your PIN.</p>
          </div>

          <a
            href="/kitchen"
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            Go to Kitchen Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Manager Portal */}
        <div className="bg-slate-900 border border-amber-800/50 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Manager Portal</h2>
              <p className="text-xs text-amber-400">Supervisory Panel</p>
            </div>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-slate-300">Enter your Manager username and PIN to access the supervisory panel.</p>
            <p className="text-[11px] text-slate-500">Contact admin if you need credential assistance.</p>
          </div>

          <a
            href="/manager"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            Go to Manager Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Admin Portal */}
        <div className="bg-slate-900 border border-rose-800/50 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Admin Portal</h2>
              <p className="text-xs text-rose-400">Super Admin Control Center</p>
            </div>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-slate-300">Enter your Super Admin username and password to access the control center.</p>
            <p className="text-[11px] text-slate-500">Max 3 concurrent admin sessions allowed.</p>
          </div>

          <a
            href="/admin"
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            Go to Admin Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Back to Customer */}
      <div className="max-w-4xl mx-auto text-center pt-4">
        <a
          href="/"
          className="text-slate-400 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Customer Menu
        </a>
      </div>
    </div>
  );
};