import React, { useState } from 'react';
import { Lock, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../lib/store';

export const PrivacyPinModal = ({ isOpen, onClose, onConfirm, title = "Security Privacy PIN Required", description = "Enter the 2nd-factor Privacy PIN to modify or cancel this committed order." }) => {
  const { currentSession } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // If user is Admin, bypass privacy PIN
  const isAdmin = currentSession?.role === 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdmin) {
      onConfirm('');
      setPin('');
      setError('');
      onClose();
      return;
    }

    if (!pin) {
      setError('Please enter the privacy PIN code.');
      return;
    }

    onConfirm(pin);
    setPin('');
    setError('');
  };

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-slate-100">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-400 text-center">{description}</p>

          {isAdmin ? (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>Logged in as <strong>Admin</strong>. Privacy PIN verification is automatically bypassed.</span>
            </div>
          ) : (
            <>
              {/* PIN Code Indicator Dots */}
              <div className="flex justify-center space-x-3 py-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? 'bg-rose-500 border-rose-400 scale-110 shadow-lg shadow-rose-500/50'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Virtual Numpad */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num.toString())}
                    className="py-3 text-lg font-bold bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white rounded-xl transition border border-slate-700"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="py-3 text-xs font-semibold bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl transition"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="py-3 text-lg font-bold bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white rounded-xl transition border border-slate-700"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-3 text-xs font-semibold bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl transition"
                >
                  DEL
                </button>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition"
            >
              {isAdmin ? "Proceed as Admin" : "Authorize Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
