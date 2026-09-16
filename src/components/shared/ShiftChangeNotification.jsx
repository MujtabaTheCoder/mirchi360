import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, X } from 'lucide-react';

export const ShiftChangeNotification = ({ previousShift, currentShift, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (previousShift && currentShift && previousShift.shiftType !== currentShift.shiftType) {
      setIsVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [previousShift, currentShift]);

  if (!isVisible || !previousShift || !currentShift) return null;

  const getShiftColor = (shiftType) => {
    switch (shiftType) {
      case 'Morning': return 'text-amber-400';
      case 'Evening': return 'text-rose-400';
      case 'Night': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const getShiftIcon = (shiftType) => {
    switch (shiftType) {
      case 'Morning': return '🌅';
      case 'Evening': return '🌆';
      case 'Night': return '🌙';
      default: return '🕐';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-extrabold text-white">Shift Change Detected</h3>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              Shift has changed from <span className={`font-bold ${getShiftColor(previousShift.shiftType)}`}>
                {getShiftIcon(previousShift.shiftType)} {previousShift.shiftName}
              </span> to <span className={`font-bold ${getShiftColor(currentShift.shiftType)}`}>
                {getShiftIcon(currentShift.shiftType)} {currentShift.shiftName}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Your login session remains active. Orders will now be tagged to the new shift.
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
