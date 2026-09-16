import React, { useState, useEffect } from 'react';
import { Clock, Flame } from 'lucide-react';
import { getCurrentShift } from '../../lib/store';

export const ShiftDisplay = ({ showLabel = true, compact = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftInfo, setShiftInfo] = useState(getCurrentShift());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const newShiftInfo = getCurrentShift(now);
      setShiftInfo(newShiftInfo);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getShiftColor = (shiftType) => {
    switch (shiftType) {
      case 'Morning': return 'text-amber-400';
      case 'Evening': return 'text-rose-400';
      case 'Night': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const getShiftBackground = (shiftType) => {
    switch (shiftType) {
      case 'Morning': return 'bg-amber-950/50 border-amber-800';
      case 'Evening': return 'bg-rose-950/50 border-rose-800';
      case 'Night': return 'bg-purple-950/50 border-purple-800';
      default: return 'bg-slate-950/50 border-slate-800';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getShiftBackground(shiftInfo.shiftType)}`}>
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-300">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`text-xs font-extrabold ${getShiftColor(shiftInfo.shiftType)}`}>
          {shiftInfo.shiftType}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${getShiftBackground(shiftInfo.shiftType)}`}>
      <Flame className="w-5 h-5 text-rose-500" />
      <div className="flex flex-col">
        {showLabel && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Current Shift
          </span>
        )}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-200">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className={`text-sm font-extrabold ${getShiftColor(shiftInfo.shiftType)}`}>
            {shiftInfo.shiftName}
          </span>
        </div>
      </div>
    </div>
  );
};
