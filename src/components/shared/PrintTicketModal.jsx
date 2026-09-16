import React, { useState } from 'react';
import { Printer, X, Check, Copy } from 'lucide-react';
import { getCurrentShift } from '../../lib/store';

export const PrintTicketModal = ({ order, isOpen, onClose }) => {
  const [copiesCount, setCopiesCount] = useState(2);

  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt || Date.now());
  const shiftInfo = getCurrentShift(orderDate);
  const shiftTypeDisplay = order.shiftType || order.shift_type || shiftInfo.shiftType;
  const shiftIdDisplay = order.shiftId || order.shift_id || shiftInfo.shiftId;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 no-print">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-rose-400">
            <Printer className="w-5 h-5" />
            <h3 className="font-bold text-slate-100">Print KOT Order Ticket #{order.orderNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Selector */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-300 font-medium">Number of Copies:</span>
          <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setCopiesCount(n)}
                className={`px-3 py-1 text-sm font-semibold rounded-lg transition ${
                  copiesCount === n ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {n} {n === 1 ? 'Copy' : 'Copies'}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Ticket Preview */}
        <div className="p-4 max-h-[50vh] overflow-y-auto bg-slate-950/50">
          {Array.from({ length: copiesCount }).map((_, index) => (
            <div key={index} className="printable-receipt mb-6 bg-white text-slate-900 p-4 rounded-lg font-mono text-sm border-2 border-dashed border-slate-300">
              <div className="text-center font-bold text-base border-b border-dashed border-slate-400 pb-2 mb-2">
                MIRCHI 360 RESTAURANT
                <div className="text-xs text-slate-600 font-normal">
                  {index === 0 ? '--- KITCHEN LINE KOT ---' : index === 1 ? '--- EXPO / PASS COPY ---' : '--- MANAGER COPY ---'}
                </div>
              </div>

              {/* DATE, TIME & SHIFT INFO ON KOT */}
              <div className="bg-slate-100 p-2 rounded mb-2 text-xs border border-slate-300 font-semibold space-y-0.5">
                <div className="flex justify-between">
                  <span>DATE: {orderDate.toLocaleDateString()}</span>
                  <span>TIME: {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>SHIFT: {shiftTypeDisplay.toUpperCase()} SHIFT</span>
                  <span>ID: {shiftIdDisplay}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs mb-1">
                <span>ORDER #: <strong className="text-sm font-extrabold">{order.orderNumber}</strong></span>
                <span>TABLE: <strong className="text-sm font-extrabold">{order.tableNumber}</strong></span>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-3 border-t border-dashed border-slate-300 pt-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-slate-100 pb-1">
                    <div>
                      <span className="font-bold text-sm mr-2">{item.quantity}x</span>
                      <span>{item.name}</span>
                      {item.variantName && <span className="ml-1 text-slate-600 font-bold">({item.variantName})</span>}
                      {item.specialNotes && (
                        <div className="text-[11px] font-semibold text-rose-700 italic">
                          * {item.specialNotes}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">PKR {item.subtotal}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-amber-50 p-2 text-xs text-amber-900 rounded border border-amber-200 mb-3 font-sans">
                  <strong>Special Instructions:</strong> {order.notes}
                </div>
              )}

              <div className="border-t border-dashed border-slate-400 pt-2 flex justify-between font-bold text-sm">
                <span>TOTAL AMOUNT:</span>
                <span>PKR {order.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print {copiesCount} KOT {copiesCount === 1 ? 'Slip' : 'Slips'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
