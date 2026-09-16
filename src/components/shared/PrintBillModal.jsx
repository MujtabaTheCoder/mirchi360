import React from 'react';
import { Printer, X, DollarSign, Receipt } from 'lucide-react';
import { getCurrentShift } from '../../lib/store';

export const PrintBillModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt || Date.now());
  const shiftInfo = getCurrentShift(orderDate);
  const shiftTypeDisplay = order.shiftType || order.shift_type || shiftInfo.shiftType;
  const shiftIdDisplay = order.shiftId || order.shift_id || shiftInfo.shiftId;

  const subtotalAmount = Number(order.totalAmount || order.total_amount || 0);
  const taxAmount = Math.round(subtotalAmount * 0.05); // 5% GST estimate
  const grandTotal = subtotalAmount + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 no-print">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-amber-400">
            <Receipt className="w-5 h-5" />
            <h3 className="font-bold text-slate-100">Print Final Customer Bill #{order.orderNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Customer Sales Bill */}
        <div className="p-4 max-h-[50vh] overflow-y-auto bg-slate-950/50">
          <div className="printable-receipt bg-white text-slate-900 p-5 rounded-lg font-mono text-sm border-2 border-slate-400 shadow">
            <div className="text-center font-bold text-base border-b-2 border-slate-900 pb-2 mb-3">
              MIRCHI 360 RESTAURANT
              <div className="text-xs font-normal text-slate-700">Official Customer Payment Bill</div>
            </div>

            {/* DATE, TIME & SHIFT INFO */}
            <div className="bg-slate-100 p-2 rounded mb-3 text-xs border border-slate-300 font-semibold space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE #: <strong className="text-sm font-black">#{order.orderNumber}</strong></span>
                <span>TABLE #: <strong className="text-sm font-black">T-{order.tableNumber}</strong></span>
              </div>
              {(order.customerName || order.customerPhone) && (
                <div className="flex justify-between text-slate-800 border-t border-slate-200 pt-1 mt-1">
                  <span>CUSTOMER: <strong>{order.customerName || 'Guest'}</strong></span>
                  <span>PHONE: <strong>{order.customerPhone || '—'}</strong></span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>DATE: {orderDate.toLocaleDateString()}</span>
                <span>TIME: {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1 mt-1">
                <span>SHIFT: {shiftTypeDisplay.toUpperCase()} SHIFT</span>
                <span>ID: {shiftIdDisplay}</span>
              </div>
            </div>

            {/* Detailed Items Table with Prices */}
            <div className="space-y-1.5 mb-4 border-b border-dashed border-slate-400 pb-3 text-xs">
              <div className="flex justify-between font-bold border-b border-slate-300 pb-1 text-slate-700">
                <span>ITEM & VARIANT</span>
                <span>QTY x PRICE = TOTAL</span>
              </div>
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-0.5">
                  <div>
                    <span className="font-bold mr-1">{item.quantity}x</span>
                    <span>{item.name}</span>
                    {item.variantName && <span className="ml-1 text-slate-600 font-semibold">({item.variantName})</span>}
                  </div>
                  <span className="font-bold">PKR {item.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Bill Financial Summary */}
            <div className="space-y-1 text-xs border-t border-slate-300 pt-2 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span>PKR {subtotalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (5%):</span>
                <span>PKR {taxAmount}</span>
              </div>
              <div className="flex justify-between font-black text-base border-t-2 border-slate-900 pt-1 text-slate-900">
                <span>PAYABLE TOTAL:</span>
                <span>PKR {grandTotal}</span>
              </div>
            </div>

            <div className="bg-slate-100 p-2 rounded text-center text-xs font-bold text-slate-800 border border-slate-300">
              STATUS: PAID / CASH & CARD PAYMENT ACCEPTED
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-3 font-sans">
              Thank you for dining with Mirchi360! Please visit again.
            </div>
          </div>
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
            className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Final Customer Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
