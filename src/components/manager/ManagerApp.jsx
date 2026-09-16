import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, LayoutDashboard, AlertCircle, Bell, ChefHat, 
  TrendingUp, FileText, Lock, MessageSquare, Plus, X, Printer, Calendar, Clock, Receipt, Phone, Trash2, CheckCircle2, CreditCard
} from 'lucide-react';
import { useApp, getCurrentShift, formatPakistanTime, formatPakistanDateTime, getPakistanDateString } from '../../lib/store';
import { PrivacyPinModal } from '../shared/PrivacyPinModal';
import { PrintBillModal } from '../shared/PrintBillModal';
import { StaffShell } from '../layout/StaffShell';
import { ShiftDisplay } from '../shared/ShiftDisplay';
import { ShiftChangeNotification } from '../shared/ShiftChangeNotification';
import { playAlertSound } from '../../lib/soundAlerts';

export const ManagerApp = () => {
  const { 
    currentSession, 
    orders, 
    updateOrderStatus, 
    markOrderServed,
    markOrderPaid,
    modifyOrderWithPrivacyPin, 
    complaints, 
    waiterCalls, 
    helpCalls, 
    branchReports, 
    addBranchReport, 
    deleteBranchReport,
    resolveComplaint, 
    resolveWaiterCall, 
    resolveHelpCall, 
    menuItems, 
    toggleItemStock, 
    getEffectiveBranchId,
    currentShift,
    previousShift
  } = useApp();

  const effectiveBranchId = getEffectiveBranchId();

  const [activeTab, setActiveTab] = useState("live");
  const [printingOrder, setPrintingOrder] = useState(null);

  const [selectedShiftFilter, setSelectedShiftFilter] = useState("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState(() => getPakistanDateString(new Date()));

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShiftClosingModalOpen, setIsShiftClosingModalOpen] = useState(false);
  
  const currentShiftInfo = getCurrentShift();
  const [shiftName, setShiftName] = useState(currentShiftInfo.shiftName);
  const [reportContent, setReportContent] = useState("");

  const [privacyModalState, setPrivacyModalState] = useState({
    isOpen: false,
    orderId: null,
    actionType: null
  });

  const activeComplaints = complaints.filter(c => c.branchId === effectiveBranchId && c.status === 'open');
  const activeWaiterCalls = waiterCalls.filter(w => w.branchId === effectiveBranchId && w.status === 'pending');
  const activeHelpCalls = helpCalls.filter(h => h.branchId === effectiveBranchId && h.status === 'active');

  const totalAlertsCount = activeComplaints.length + activeWaiterCalls.length + activeHelpCalls.length;
  const prevAlertsRef = useRef(totalAlertsCount);

  useEffect(() => {
    if (totalAlertsCount > prevAlertsRef.current) {
      playAlertSound();
    }
    prevAlertsRef.current = totalAlertsCount;
  }, [totalAlertsCount]);

  const branchOrders = orders.filter(o => {
    const isBranchMatch = o.branchId === effectiveBranchId;
    const orderDateStr = getPakistanDateString(o.createdAt);
    const isDateMatch = !selectedDateFilter || orderDateStr === selectedDateFilter;
    const orderShift = o.shiftType || o.shift_type || 'Evening';
    const isShiftMatch = selectedShiftFilter === 'ALL' || orderShift === selectedShiftFilter;
    return isBranchMatch && isDateMatch && isShiftMatch;
  });

  const reportsList = branchReports.filter(r => r.branchId === effectiveBranchId);

  const completedOrders = branchOrders.filter(o => o.status === 'completed' || o.status === 'served' || o.status === 'ready' || o.status === 'preparing');
  const totalSalesRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total_amount) || 0), 0);
  const cancelledCount = branchOrders.filter(o => o.status === 'cancelled').length;

  const handleInitiateCancel = (orderId) => {
    setPrivacyModalState({ isOpen: true, orderId, actionType: 'CANCEL' });
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

  const handleCreateReportSubmit = (e) => {
    e.preventDefault();
    if (!reportContent.trim()) return;
    addBranchReport({ 
      shiftName, 
      shiftType: currentShiftInfo.shiftType,
      reportType: "Incident",
      content: reportContent 
    });
    setReportContent("");
    setIsReportModalOpen(false);
    alert("Branch Shift Incident Report logged!");
  };

  const handleShiftClosingSubmit = (e) => {
    e.preventDefault();
    addBranchReport({
      shiftName: currentShiftInfo.shiftName,
      shiftType: currentShiftInfo.shiftType,
      reportType: "ShiftClosing",
      totalShiftSales: totalSalesRevenue,
      totalOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledCount,
      content: `SHIFT CLOSING SUMMARY: Total Sales PKR ${totalSalesRevenue} across ${completedOrders.length} completed orders. ${cancelledCount} cancelled orders. Notes: ${reportContent || 'Routine handover completed clean.'}`
    });
    setReportContent("");
    setIsShiftClosingModalOpen(false);
    alert(`Shift Handover & Closing Report for ${currentShiftInfo.shiftName} generated!`);
  };

  return (
    <div className="overflow-x-hidden">
      <StaffShell
      title="Manager Supervisory Panel"
      icon={ShieldCheck}
      iconWrapClass="bg-amber-500/20 border-amber-500/30 text-amber-500"
      actions={
        <div className="flex flex-col sm:flex-row gap-2">
          <ShiftDisplay compact={true} />
          <button
            onClick={() => setIsShiftClosingModalOpen(true)}
            className="w-full lg:w-auto px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1.5 min-h-[40px]"
          >
            <FileText className="w-4 h-4" />
            <span>Shift Closing</span>
          </button>
        </div>
      }
    >

      {/* Date & Shift Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 overflow-x-hidden">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Filter Date:</span>
          </div>
          <input
            type="date"
            value={selectedDateFilter}
            onChange={e => setSelectedDateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide pb-1 touch-pan-x">
          <span className="text-xs text-slate-400 font-bold mr-1">Filter Shift:</span>
          {["ALL", "Morning", "Evening", "Night"].map(shift => (
            <button
              key={shift}
              onClick={() => setSelectedShiftFilter(shift)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition border ${
                selectedShiftFilter === shift
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {shift}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Incident Alerts Banner */}
      {(activeComplaints.length > 0 || activeWaiterCalls.length > 0 || activeHelpCalls.length > 0) && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border border-rose-800/80 rounded-2xl p-4 space-y-3 shadow-2xl animate-in fade-in duration-300">
          <div className="text-xs font-extrabold text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>ATTENTION REQUIRED — LIVE INCIDENT QUEUE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeHelpCalls.map(h => (
              <div key={h.id} className="bg-slate-950/80 border border-amber-500/50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                  <span className="flex items-center space-x-1">
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Kitchen: {h.stationName}</span>
                  </span>
                  <button onClick={() => resolveHelpCall(h.id)} className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-extrabold">Mark Resolved</button>
                </div>
                <p className="text-xs text-slate-300">{h.message}</p>
              </div>
            ))}

            {activeComplaints.map(c => (
              <div key={c.id} className="bg-slate-950/80 border border-rose-500/50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-rose-400">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Table {c.tableNumber} Complaint</span>
                  </span>
                  <button onClick={() => resolveComplaint(c.id)} className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-extrabold">Resolve</button>
                </div>
                <p className="text-xs text-slate-300">"{c.message}"</p>
              </div>
            ))}

            {activeWaiterCalls.map(w => (
              <div key={w.id} className="bg-slate-950/80 border border-blue-500/50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-blue-400">
                  <span className="flex items-center space-x-1">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Table {w.tableNumber} Waiter Call</span>
                  </span>
                  <button onClick={() => resolveWaiterCall(w.id)} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-extrabold">Attended</button>
                </div>
                <p className="text-xs text-slate-300">{w.requestType}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 touch-pan-x">
        {[
          { id: "live", label: `Orders (${branchOrders.length})`, icon: LayoutDashboard },
          { id: "sales", label: "Sales Analytics", icon: TrendingUp },
          { id: "reports", label: "Reports Log", icon: FileText },
          { id: "stock", label: "Stock", icon: ChefHat }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Orders Oversight */}
      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchOrders.map((order) => {
              const shiftLabel = order.shiftType || order.shift_type || 'Evening';
              return (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <div className="text-base font-black text-white">Invoice #{order.orderNumber}</div>
                      <div className="text-xs font-bold text-amber-400">TABLE {order.tableNumber} • {shiftLabel} Shift</div>
                      {(order.customerName || order.customerPhone) && (
                        <div className="mt-1.5 text-[11px] text-slate-200 font-semibold flex items-start gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>
                            {order.customerName || "Guest"}
                            <span className="block text-slate-400 font-medium">{order.customerPhone}</span>
                          </span>
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-slate-500">
                        {formatPakistanTime(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase inline-block ${
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                        order.status === 'served' ? 'bg-purple-500/20 text-purple-400' :
                        order.status === 'completed' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {order.status}
                      </span>
                      <div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                          order.payment === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {order.payment === 'Paid' ? '✓ Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs py-1 text-slate-300">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                        <span className="font-semibold text-slate-400">PKR {item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Bill Total:</span>
                    <span className="text-base font-extrabold text-amber-400">PKR {order.totalAmount}</span>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    {order.status === 'ready' && (
                      <button
                        onClick={() => markOrderServed(order.id)}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Served (Unpaid)
                      </button>
                    )}

                    {order.status === 'served' && order.payment === 'Unpaid' && (
                      <>
                        <button
                          onClick={() => setPrintingOrder(order)}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
                        >
                          <Printer className="w-4 h-4" />
                          Print Bill
                        </button>
                        <button
                          onClick={() => markOrderPaid(order.id)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow min-h-[44px] flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-4 h-4" />
                          Mark Paid & Complete
                        </button>
                      </>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'ready' && order.status !== 'served' && (
                      <button
                        onClick={() => setPrintingOrder(order)}
                        className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
                      >
                        <Receipt className="w-4 h-4" />
                        Print Bill
                      </button>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleInitiateCancel(order.id)}
                        className="w-full py-3 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Lock className="w-4 h-4" />
                        Cancel Direct
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Sales Analytics */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Filtered Sales ({selectedShiftFilter} Shift)</span>
              <div className="text-xl sm:text-2xl font-black text-amber-400">PKR {totalSalesRevenue}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Completed / Served Orders</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{completedOrders.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Cancelled Orders</span>
              <div className="text-xl sm:text-2xl font-black text-rose-400">{cancelledCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Shift Reports */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Branch Shift Reports Log</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setIsReportModalOpen(true)} className="px-3.5 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow">
                <Plus className="w-4 h-4" />
                <span>Log Incident</span>
              </button>
              <button onClick={() => setIsShiftClosingModalOpen(true)} className="px-3.5 py-2 bg-rose-600 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow">
                <FileText className="w-4 h-4" />
                <span>Shift Closing Handover</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {reportsList.map(rep => (
              <div key={rep.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
                  <span className="font-bold text-amber-400">{rep.shiftName} by {rep.managerName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{formatPakistanDateTime(rep.createdAt)}</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete this report?`)) {
                          deleteBranchReport(rep.id);
                        }
                      }}
                      className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-400 rounded-lg border border-rose-800 transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {rep.reportType === 'ShiftClosing' && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-bold text-emerald-400 flex justify-between">
                    <span>Shift Revenue: PKR {rep.totalShiftSales}</span>
                    <span>Orders: {rep.totalOrdersCount}</span>
                    <span>Cancelled: {rep.cancelledOrdersCount}</span>
                  </div>
                )}
                <p className="text-xs text-slate-200">{rep.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Stock Availability */}
      {activeTab === "stock" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Menu Stock Availability Control</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-slate-100">{item.name}</h4>
                  <span className="text-[11px] text-amber-400 font-semibold">PKR {item.price}</span>
                </div>
                <button
                  onClick={() => toggleItemStock(item.id)}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition ${
                    item.isOutOfStock ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {item.isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Customer Sales Bill Print Modal */}
      <PrintBillModal order={printingOrder} isOpen={Boolean(printingOrder)} onClose={() => setPrintingOrder(null)} />
      
      <PrivacyPinModal isOpen={privacyModalState.isOpen} onClose={() => setPrivacyModalState({ isOpen: false, orderId: null, actionType: null })} onConfirm={handlePrivacyPinConfirm} title="Privacy PIN Required — Manager Override" description="Editing or cancelling committed orders requires the 2nd-factor Privacy PIN." />

      {/* Shift Closing Modal */}
      {isShiftClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-amber-400">Generate Shift Handover / Closing Report</h3>
              <button onClick={() => setIsShiftClosingModalOpen(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Active Shift:</span>
                <strong className="text-amber-400">{currentShiftInfo.shiftName} ({currentShiftInfo.shiftId})</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Shift Revenue:</span>
                <strong className="text-emerald-400 text-sm">PKR {totalSalesRevenue}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Completed Orders Count:</span>
                <strong className="text-slate-100">{completedOrders.length}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cancelled Orders Count:</span>
                <strong className="text-rose-400">{cancelledCount}</strong>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Shift Notes & Cash Handover Details</label>
              <textarea
                rows={3}
                placeholder="Write shift handover summary, cash register balance, or maintenance notes..."
                value={reportContent}
                onChange={e => setReportContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsShiftClosingModalOpen(false)} className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl">Cancel</button>
              <button onClick={handleShiftClosingSubmit} className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-400 rounded-xl shadow">Generate & Save Shift Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Shift Incident Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-amber-400">Write Shift Incident Report</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Shift Name</label>
              <select value={shiftName} onChange={e => setShiftName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                <option>Morning Shift</option>
                <option>Evening Shift</option>
                <option>Night Shift</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Incident / Maintenance Summary</label>
              <textarea rows={4} placeholder="Log incident details..." value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100" />
            </div>
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsReportModalOpen(false)} className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl">Cancel</button>
              <button onClick={handleCreateReportSubmit} className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-400 rounded-xl shadow">Save Incident Log</button>
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
