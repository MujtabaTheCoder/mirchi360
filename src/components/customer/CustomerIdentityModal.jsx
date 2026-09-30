import React, { useState, useEffect } from "react";
import { User, Phone, Flame, ArrowRight } from "lucide-react";

export const CustomerIdentityModal = ({ initialName = "", initialPhone = "", isOpen, onClose, onSave }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setPhone(initialPhone || "");
      setError("");
    }
  }, [isOpen, initialName, initialPhone]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const digitsOnly = phone.replace(/[^\d+]/g, "");

    if (phone.trim() && (!digitsOnly || !/^\+?\d{10,15}$/.test(digitsOnly))) {
      setError("Please enter a valid phone number (10–15 digits) or leave blank.");
      return;
    }
    onSave({ name: trimmedName, phone: digitsOnly });
  };

  const handleQuickGuest = () => {
    onSave({ name: "", phone: "" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Table Order Details</h2>
            <p className="text-xs text-slate-400">Add contact info or proceed directly as guest.</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-300 bg-rose-950/70 border border-rose-800 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Customer Name (Optional)</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ali Khan"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Phone Number (Optional)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl min-h-[44px] shadow-lg flex items-center justify-center gap-2"
          >
            <span>Confirm & Send to Kitchen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleQuickGuest}
            className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl min-h-[40px] transition"
          >
            ⚡ Quick Order as Guest (Skip Details)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs rounded-xl min-h-[36px]"
          >
            Back to Cart (Cancel)
          </button>
        </div>
      </form>
    </div>
  );
};

