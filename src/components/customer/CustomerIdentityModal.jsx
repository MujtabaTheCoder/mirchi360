import React, { useState } from "react";
import { User, Phone, Flame } from "lucide-react";

export const CustomerIdentityModal = ({ initialName = "", initialPhone = "", isOpen, onClose, onSave }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/\s+/g, "");
    if (trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(trimmedPhone)) {
      setError("Enter a valid phone number (10–15 digits).");
      return;
    }
    onSave({ name: trimmedName, phone: trimmedPhone });
  };

  const handleClose = () => {
    onClose();
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
            <h2 className="text-base font-extrabold text-white">Welcome to Mirchi 360</h2>
            <p className="text-xs text-slate-400">Please share your details before ordering.</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-300 bg-rose-950/70 border border-rose-800 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Customer Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Phone Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XXXXXXXXX"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-2xl min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-2xl min-h-[44px]"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};
