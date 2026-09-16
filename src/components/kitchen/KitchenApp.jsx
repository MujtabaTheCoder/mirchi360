import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Clock, Printer, CheckCircle, Flame, 
  Lock, Slash, Bell, X, Phone
} from 'lucide-react';
import { useApp, getCurrentShift, formatPakistanTime } from '../../lib/store';
import { PrintKotModal } from '../shared/PrintKotModal';
import { PrivacyPinModal } from '../shared/PrivacyPinModal';
import { StaffShell } from '../layout/StaffShell';
import { ShiftDisplay } from '../shared/ShiftDisplay';
import { ShiftChangeNotification } from '../shared/ShiftChangeNotification';
import { playOrderSound } from '../../lib/soundAlerts';

export const KitchenApp = () => {
  const { 
    currentSession, 
    orders, 
    updateOrderStatus, 
    modifyOrderWithPrivacyPin, 
    sendKitchenHelpCall, 
    menuItems, 
    toggleItemStock, 
    getEffectiveBranchId,
    currentShift,
    previousShift
  } = useApp();

  const effectiveBranchId = getEffectiveBranchId();

  const [printingOrder, setPrintingOrder] = useState(null);

  const [privacyModalState, setPrivacyModalState] = useState({
    isOpen: false,
    orderId: null,
    actionType: null
  });

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [stationName, setStationName] = useState("Karahi & BBQ Station 1");
  const [helpMessage, setHelpMessage] = useState("Require additional line chef for peak rush!");

  const activeShift = getCurrentShift();
  const kitchenOrders = orders.filter(o => 
    o.branchId === effectiveBranchId && 
    o.status !== 'completed' && 
    o.status !== 'cancelled' &&
    o.status !== 'served'
  );

  const prevCountRef = useRef(kitchenOrders.length);
  useEffect(() => {
    if (kitchenOrders.length > prevCountRef.current) {
      playOrderSound();
    }
    prevCountRef.current = kitchenOrders.length;
  }, [kitchenOrders.length]);

  const handleInitiateCancel = (orderId) => {
    setPrivacyModalState({
      isOpen: true,
      orderId,
      actionType: 'CANCEL'
    });
  };

  const handlePrivacyPinConfirm = (pinCode) => {
    const { orderId, actionType } = privacyModalState;
    if (orderId && actionType) {
      const res = modifyOrderWithPrivacyPin(orderId, actionType, {}, pinCode);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleSendHelpSubmit = (e) => {
    e.preventDefault();
    sendKitchenHelpCall(stationName, helpMessage);
    setIsHelpModalOpen(false);
    alert("Manager Alerted! Kitchen help signal transmitted to Manager Panel.");
  };

  return (
    <div className="overflow-x-hidden">
      <StaffShell
      title="Kitchen Live Display (KDS)"
      icon={ChefHat}
      iconWrapClass="bg-rose-600/20 border-rose-500/30 text-rose-500"
      badge={
        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
          LIVE
        </span>
      }
      actions={
        <div className="flex flex-col sm:flex-row gap-2">
          <ShiftDisplay compact={true} />
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full lg:w-auto px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 min-h-[40px]"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Call Help</span>
          </button>
        </div>
      }
    >

      {/* Quick Out-Of-Stock Item Toggle Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="text-xs font-extrabold text-slate-300 mb-2.5 flex items-center space-x-2">
          <Slash className="w-4 h-4 text-rose-500" />
          <span>Quick Item Stock Toggle (Instant Customer Update)</span>
        </div>
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide gap-2 pb-1 -mx-1 px-1 touch-pan-x">
          {menuItems.slice(0, 14).map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItemStock(item.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition border ${
                item.isOutOfStock
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700 line-through'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {item.name} {item.isOutOfStock ? '(OUT)' : '(IN)'}
            </button>
          ))}
        </div>
      </div>

      {/* Incoming Orders Tickets Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Active Tickets Queue ({kitchenOrders.length})</span>
          </h2>
        </div>

        {kitchenOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-slate-500 space-y-2">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500/40 mx-auto" />
            <p className="font-bold text-sm text-slate-400">All kitchen orders served! Standing by for incoming tickets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-hidden">
            {kitchenOrders.map((order) => {
              const estMins = order.estimatedMinutes || order.estimated_minutes;
              const shiftLabel = order.shiftType || order.shift_type || activeShift.shiftType;

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900 border rounded-3xl p-3 sm:p-4 space-y-3.5 shadow-2xl flex flex-col justify-between transition ${
                    order.status === 'pending'
                      ? 'border-amber-500/50 shadow-amber-950/20'
                      : 'border-blue-500/40 shadow-blue-950/20'
                  }`}
                >
                  <div>
                    {/* Order Ticket Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-400">INVOICE</span>
                          <span className="text-base sm:text-lg font-black text-white">#{order.orderNumber}</span>
                        </div>
                        <div className="text-xs text-rose-400 font-extrabold">
                          TABLE {order.tableNumber}
                        </div>
                        {(order.customerName || order.customerPhone) ? (
                          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-amber-300 font-bold mt-1.5 flex items-center gap-1.5 shadow-inner">
                            <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{order.customerName || 'Customer'} · <span className="font-mono text-white">{order.customerPhone}</span></span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic mt-1">Dine-in Customer</div>
                        )}
                        <div className="text-[10px] text-slate-500 font-bold">
                          {shiftLabel} Shift
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">
                          {formatPakistanTime(order.createdAt)}
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          order.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="py-3 space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 p-2 sm:p-2.5 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-white text-sm">
                              {item.quantity}x {item.name}
                            </span>
                            {item.variantName && (
                              <span className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                          {item.specialNotes && (
                            <p className="text-[11px] text-amber-300 font-semibold italic bg-amber-950/40 p-1 rounded border border-amber-900/50">
                              * Note: {item.specialNotes}
                            </p>
                          )}
                        </div>
                      ))}

                      {order.notes && (
                        <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-300">
                          <strong className="text-amber-400">Order Note:</strong> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ticket Controls & Action Bar */}
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    {/* Estimated Ready Time Quick Buttons */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold block">Set Customer Ready Time:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                        {[10, 15, 25, 35].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => updateOrderStatus(order.id, 'preparing', mins)}
                            className={`w-full py-2.5 text-[11px] font-bold rounded-lg border transition min-h-[44px] ${
                              Number(estMins) === mins
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Progression Buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      {order.status === 'pending' ? (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing', 15)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow min-h-[44px]"
                        >
                          Start Preparing
                        </button>
                      ) : (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow min-h-[44px]"
                        >
                          Mark Order Ready
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => setPrintingOrder(order)}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <Printer className="w-4 h-4" />
                          Print KOT
                        </button>
                        <button
                          onClick={() => handleInitiateCancel(order.id)}
                          className="w-full py-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <Lock className="w-4 h-4" />
                          Cancel Direct
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KOT Printing Modal (No Prices) */}
      <PrintKotModal
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
      />

      {/* Privacy PIN Verification Modal */}
      <PrivacyPinModal
        isOpen={privacyModalState.isOpen}
        onClose={() => setPrivacyModalState({ isOpen: false, orderId: null, actionType: null })}
        onConfirm={handlePrivacyPinConfirm}
        title="Privacy PIN Gate — Modify Order"
        description="Kitchen staff cannot cancel or edit a committed order without entering the 2nd-factor Privacy PIN."
      />

      {/* Kitchen Call Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-amber-400 flex items-center space-x-1.5">
                <Bell className="w-4 h-4" />
                <span>Transmit Help Alert to Manager</span>
              </h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Station Name</label>
              <input
                type="text"
                value={stationName}
                onChange={e => setStationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Alert Details / Reason</label>
              <textarea
                rows={3}
                value={helpMessage}
                onChange={e => setHelpMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendHelpSubmit}
                className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow"
              >
                Send Help Signal
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
    
    {/* Shift Change Notification */}
    <ShiftChangeNotification 
      previousShift={previousShift} 
      currentShift={currentShift}
    />
    </div>
  );
};
