import React, { useState, useMemo } from 'react';
import { 
  Crown, Users, Utensils, QrCode, FileSearch, 
  TrendingUp, Plus, Edit2, Lock, X, BarChart3, Calendar, 
  Sun, Moon, Sunset, Phone, Trash2, CheckCircle, AlertTriangle, 
  MessageSquare, Download, Printer, Search, RefreshCw, DollarSign, 
  Archive, Clock, ChevronRight, User
} from 'lucide-react';
import { useApp, formatPakistanTime, formatPakistanDateTime, getPakistanDateString } from '../../lib/store';
import { StaffShell } from '../layout/StaffShell';
import { ShiftDisplay } from '../shared/ShiftDisplay';
import { ShiftChangeNotification } from '../shared/ShiftChangeNotification';
import { SEED_DATA } from '../../lib/initialData';
import { PortalLogin } from '../auth/PortalLogin';

export const AdminApp = () => {
  const { 
    currentSession, 
    activeSessions, 
    orders, 
    clearAllOrders,
    menuItems, 
    saveMenuItem, 
    toggleItemStock, 
    auditLogs, 
    modifyOrderWithPrivacyPin, 
    selectedBranch, 
    setSelectedBranch,
    branches,
    branchReports,
    deleteBranchReport,
    complaints,
    resolveComplaint,
    logoutStaff,
    currentShift,
    previousShift
  } = useApp();

  const [activeTab, setActiveTab] = useState("overview");

  // Date Filtering Controls
  // period: 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  const [periodType, setPeriodType] = useState("today");
  
  const todayStr = useMemo(() => getPakistanDateString(new Date()), []);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getPakistanDateString(d);
  });
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  const [filterShift, setFilterShift] = useState("ALL");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [complaintFilterStatus, setComplaintFilterStatus] = useState("ALL");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [qrBranch, setQrBranch] = useState("Defence");
  const [qrTableNum, setQrTableNum] = useState(4);

  const [staffList, setStaffList] = useState(SEED_DATA.staff);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffUser, setNewStaffUser] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("manager");

  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("New Arrivals");
  const [itemPrice, setItemPrice] = useState(500);
  const [itemImage, setItemImage] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variantType, setVariantType] = useState("size");

  if (!currentSession || currentSession.role !== 'admin') {
    const blocked = currentSession && currentSession.role !== 'admin' ? currentSession : undefined;
    return <PortalLogin expectedRole="admin" blockedSession={blocked} />;
  }

  // Calculate Date Match based on selected period
  const isDateInPeriod = (dateInput) => {
    if (!dateInput) return false;
    const dateStr = getPakistanDateString(dateInput);
    
    if (periodType === 'all') return true;

    if (periodType === 'today') {
      return dateStr === todayStr;
    }

    if (periodType === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return dateStr === getPakistanDateString(y);
    }

    if (periodType === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStartStr = getPakistanDateString(weekAgo);
      return dateStr >= weekStartStr && dateStr <= todayStr;
    }

    if (periodType === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthStartStr = getPakistanDateString(monthAgo);
      return dateStr >= monthStartStr && dateStr <= todayStr;
    }

    if (periodType === 'custom') {
      return (!customStartDate || dateStr >= customStartDate) && 
             (!customEndDate || dateStr <= customEndDate);
    }

    return true;
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const isDateMatch = isDateInPeriod(o.createdAt);
    const orderShift = o.shiftType || o.shift_type || 'Evening';
    const isShiftMatch = filterShift === 'ALL' || orderShift === filterShift;
    const orderBranchId = o.branchId || o.branch_id;
    const isBranchMatch = filterBranch === 'ALL' || orderBranchId === filterBranch;
    return isDateMatch && isShiftMatch && isBranchMatch;
  });

  // Completed Orders across period
  const completedOrdersList = filteredOrders.filter(o => 
    o.status === 'completed' || o.payment === 'Paid' || o.status === 'served'
  );

  const totalSystemRevenue = completedOrdersList.reduce((sum, o) => 
    sum + (Number(o.totalAmount || o.total_amount) || 0), 0
  );

  const avgOrderValue = completedOrdersList.length > 0 
    ? Math.round(totalSystemRevenue / completedOrdersList.length) 
    : 0;

  // Filtered Complaints
  const filteredComplaints = complaints.filter(c => {
    const isDateMatch = isDateInPeriod(c.createdAt);
    const cShift = c.shiftType || c.shift_type || 'Evening';
    const isShiftMatch = filterShift === 'ALL' || cShift === filterShift;
    const cBranchId = c.branchId || c.branch_id;
    const isBranchMatch = filterBranch === 'ALL' || cBranchId === filterBranch;
    const isStatusMatch = complaintFilterStatus === 'ALL' || c.status === complaintFilterStatus;
    return isDateMatch && isShiftMatch && isBranchMatch && isStatusMatch;
  });

  // Shift Statistics (Morning, Evening, Night)
  const getShiftStats = (shiftNameStr) => {
    const shiftOrds = filteredOrders.filter(o => {
      const oShift = o.shiftType || o.shift_type || 'Evening';
      return oShift === shiftNameStr && (o.status === 'completed' || o.payment === 'Paid' || o.status === 'served');
    });

    const shiftSales = shiftOrds.reduce((sum, o) => sum + (Number(o.totalAmount || o.total_amount) || 0), 0);
    const shiftComplaints = filteredComplaints.filter(c => {
      const cShift = c.shiftType || c.shift_type || 'Evening';
      return cShift === shiftNameStr;
    }).length;

    return { count: shiftOrds.length, sales: shiftSales, complaints: shiftComplaints };
  };

  const morningStats = getShiftStats('Morning');
  const eveningStats = getShiftStats('Evening');
  const nightStats = getShiftStats('Night');

  // Daily Breakdown Aggregation (for Day-by-Day Historical Analysis)
  const dailyBreakdown = useMemo(() => {
    const daysMap = {};

    filteredOrders.forEach(o => {
      const dateStr = getPakistanDateString(o.createdAt);
      if (!daysMap[dateStr]) {
        daysMap[dateStr] = {
          dateStr,
          dateObj: new Date(o.createdAt),
          totalRevenue: 0,
          completedCount: 0,
          cancelledCount: 0,
          totalOrdersCount: 0,
          morningSales: 0,
          eveningSales: 0,
          nightSales: 0,
          morningOrders: 0,
          eveningOrders: 0,
          nightOrders: 0,
          complaintsCount: 0
        };
      }

      daysMap[dateStr].totalOrdersCount++;
      const isCompleted = o.status === 'completed' || o.payment === 'Paid' || o.status === 'served';
      const isCancelled = o.status === 'cancelled';
      const amount = Number(o.totalAmount || o.total_amount) || 0;
      const shift = o.shiftType || o.shift_type || 'Evening';

      if (isCompleted) {
        daysMap[dateStr].totalRevenue += amount;
        daysMap[dateStr].completedCount++;
        if (shift === 'Morning') {
          daysMap[dateStr].morningSales += amount;
          daysMap[dateStr].morningOrders++;
        } else if (shift === 'Night') {
          daysMap[dateStr].nightSales += amount;
          daysMap[dateStr].nightOrders++;
        } else {
          daysMap[dateStr].eveningSales += amount;
          daysMap[dateStr].eveningOrders++;
        }
      } else if (isCancelled) {
        daysMap[dateStr].cancelledCount++;
      }
    });

    // Add complaints counts to day map
    filteredComplaints.forEach(c => {
      const dateStr = getPakistanDateString(c.createdAt);
      if (daysMap[dateStr]) {
        daysMap[dateStr].complaintsCount++;
      }
    });

    return Object.values(daysMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredOrders, filteredComplaints]);

  // Search-filtered Completed Orders for Archive tab
  const searchedCompletedOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return completedOrdersList;
    const q = orderSearchQuery.toLowerCase();
    return completedOrdersList.filter(o => {
      const matchNum = String(o.orderNumber || '').toLowerCase().includes(q);
      const matchTable = String(o.tableNumber || '').toLowerCase().includes(q);
      const matchCust = (o.customerName || '').toLowerCase().includes(q) || (o.customerPhone || '').includes(q);
      const matchItems = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      const matchShift = (o.shiftType || '').toLowerCase().includes(q) || (o.shiftId || '').toLowerCase().includes(q);
      return matchNum || matchTable || matchCust || matchItems || matchShift;
    });
  }, [completedOrdersList, orderSearchQuery]);

  const filteredReports = branchReports.filter(rep => {
    const isDateMatch = isDateInPeriod(rep.createdAt);
    const repBranchId = rep.branchId || rep.branch_id;
    const isBranchMatch = filterBranch === 'ALL' || repBranchId === filterBranch;
    const repShift = rep.shiftType || 'Evening';
    const isShiftMatch = filterShift === 'ALL' || repShift === filterShift;
    return isDateMatch && isBranchMatch && isShiftMatch;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const isDateMatch = isDateInPeriod(log.createdAt);
    const logBranchId = log.branchId || log.branch_id;
    const isBranchMatch = filterBranch === 'ALL' || logBranchId === filterBranch;
    return isDateMatch && isBranchMatch;
  });

  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.categoryName);
      setItemPrice(item.price);
      setItemImage(item.image || "");
      setHasVariants(Boolean(item.hasVariants));
      setVariantType(item.variantType || "size");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemCategory("New Arrivals");
      setItemPrice(500);
      setItemImage("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80");
      setHasVariants(false);
      setVariantType("size");
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItemSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    let variantsList = null;
    if (hasVariants) {
      if (variantType === 'size') {
        variantsList = [
          { name: "Small", price: Number(itemPrice) },
          { name: "Medium", price: Math.round(Number(itemPrice) * 2.3) },
          { name: "Large", price: Math.round(Number(itemPrice) * 3.8) }
        ];
      } else {
        variantsList = [
          { name: "Half", price: Number(itemPrice) },
          { name: "Full", price: Math.round(Number(itemPrice) * 1.8) }
        ];
      }
    }

    saveMenuItem({
      ...(editingItem ? { id: editingItem.id } : {}),
      name: itemName,
      categoryName: itemCategory,
      price: Number(itemPrice),
      image: itemImage || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      hasVariants,
      variantType: hasVariants ? variantType : null,
      variants: variantsList
    });

    setIsItemModalOpen(false);
    alert(`Menu item "${itemName}" saved successfully!`);
  };

  const handleCreateStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUser || !newStaffPin) return;

    const newAcc = {
      id: `st-${Date.now()}`,
      name: newStaffName,
      username: newStaffUser,
      pin: newStaffPin,
      role: newStaffRole,
      privacyPin: "9999",
      branchId: selectedBranch.id
    };

    setStaffList(prev => [...prev, newAcc]);
    SEED_DATA.staff.push(newAcc);

    setNewStaffName("");
    setNewStaffUser("");
    setNewStaffPin("");
    setIsStaffModalOpen(false);
    alert(`Staff account "${newStaffName}" created! Username: ${newStaffUser}`);
  };

  const handleAdminDirectCancelOrder = (orderId) => {
    if (window.confirm(`Admin Override: Cancel order #${orderId} directly without Privacy PIN?`)) {
      modifyOrderWithPrivacyPin(orderId, 'CANCEL', { reason: "Cancelled directly by Super Admin override" }, '');
    }
  };

  // Export / Print formatted summary
  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Morning Sales (PKR)", "Evening Sales (PKR)", "Night Sales (PKR)", "Total Revenue (PKR)", "Completed Orders", "Complaints"];
    const rows = dailyBreakdown.map(d => [
      d.dateStr,
      d.morningSales,
      d.eveningSales,
      d.nightSales,
      d.totalRevenue,
      d.completedCount,
      d.complaintsCount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mirchi360_Sales_Report_${periodType}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatedQrUrl = `${window.location.origin}${window.location.pathname}?branch=${qrBranch}&table=${qrTableNum}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 space-y-5 font-sans overflow-x-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl overflow-x-hidden">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Crown className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-100 uppercase tracking-wide truncate">SUPER ADMIN CONTROL CENTER</h1>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold shrink-0">
                All History Permanently Saved
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Admin: <strong className="text-slate-200">{currentSession.name}</strong> ({currentSession.username}) • 
              Active Shift: <span className="text-amber-400 font-bold ml-1">{currentShift.shiftName} ({currentShift.shiftId})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all existing orders and reset invoice counter to start from 1?")) {
                clearAllOrders();
                alert("All orders cleared! Next order will start from Invoice #1.");
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl border border-slate-700 hover:border-rose-800 flex items-center gap-1.5 transition"
            title="Clear all orders and restart invoice from #1"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Reset / Start from #1</span>
          </button>
          <button
            onClick={handlePrintSummary}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            title="Print Current Report"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            title="Export CSV Data"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={logoutStaff}
            className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Persistent Comprehensive Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-bold mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              Time Range:
            </span>
            {[
              { id: "today", label: "Today (Aaj)" },
              { id: "yesterday", label: "Yesterday (Kal)" },
              { id: "week", label: "Last 7 Days (Week)" },
              { id: "month", label: "Last 30 Days (Month)" },
              { id: "all", label: "All-Time Records" },
              { id: "custom", label: "Custom Date" }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodType(p.id)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition border shrink-0 ${
                  periodType === p.id
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodType === 'custom' && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400 font-bold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-rose-400 font-bold focus:outline-none"
              />
              <span className="text-slate-400 font-bold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-rose-400 font-bold focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide">
            <span className="text-xs text-slate-400 font-bold mr-1 shrink-0">Branch:</span>
            <button
              key="ALL"
              onClick={() => setFilterBranch("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition border shrink-0 ${
                filterBranch === "ALL"
                  ? 'bg-rose-600 text-white border-rose-500 shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              All Branches
            </button>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBranch(b.id)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition border shrink-0 ${
                  filterBranch === b.id
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide">
            <span className="text-xs text-slate-400 font-bold mr-1 shrink-0">Shift Scope:</span>
            {["ALL", "Morning", "Evening", "Night"].map(s => (
              <button
                key={s}
                onClick={() => setFilterShift(s)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition border shrink-0 ${
                  filterShift === s
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Shifts' : `${s} Shift`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: "overview", label: "Live Orders Matrix", icon: TrendingUp },
          { id: "daily_weekly", label: "Day & Month Sales Matrix", icon: BarChart3 },
          { id: "completed_archive", label: `Completed Orders Archive (${completedOrdersList.length})`, icon: Archive },
          { id: "shift_closing_reports", label: `Shift Closing Reports (${filteredReports.length})`, icon: FileText },
          { id: "complaints", label: `Complaints Log (${filteredComplaints.length})`, icon: MessageSquare },
          { id: "shift_analytics", label: "Shift Performance Breakdown", icon: Clock },
          { id: "menu", label: "Menu & Variants", icon: Utensils },
          { id: "staff", label: "Staff PINs", icon: Users },
          { id: "qr", label: "Table QR Link", icon: QrCode },
          { id: "audit", label: "Audit Trail", icon: FileSearch }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & MASTER ORDERS MATRIX */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Filtered Gross Revenue</span>
              <div className="text-2xl font-black text-amber-400">PKR {totalSystemRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">{periodType.toUpperCase()} window</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Completed Orders</span>
              <div className="text-2xl font-black text-white">{completedOrdersList.length}</div>
              <span className="text-[10px] text-slate-500 font-medium">Avg Value: PKR {avgOrderValue}</span>
            </div>
            <div 
              onClick={() => setActiveTab("shift_closing_reports")}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl space-y-1 cursor-pointer transition"
            >
              <span className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                <span>Shift Closings</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="text-2xl font-black text-amber-400">
                {filteredReports.filter(r => r.reportType === 'ShiftClosing').length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{filteredReports.length} total shift logs</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Logged Complaints</span>
              <div className="text-2xl font-black text-rose-400">{filteredComplaints.length}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                {filteredComplaints.filter(c => c.status === 'open').length} Open / {filteredComplaints.filter(c => c.status === 'resolved').length} Resolved
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Total Filtered Orders</span>
              <div className="text-2xl font-black text-emerald-400">{filteredOrders.length}</div>
              <span className="text-[10px] text-slate-500 font-medium">All statuses (active & completed)</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
                  Active & Live Orders Matrix
                </h2>
                <p className="text-xs text-slate-400">Manage orders, view shift tags, and perform direct Super Admin cancellations.</p>
              </div>
              <button 
                onClick={() => setActiveTab("completed_archive")}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start sm:self-auto"
              >
                View Full Completed Orders Ledger <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-3">Order #</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Table</th>
                    <th className="p-3">Shift Tag</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Direct Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.slice(0, 50).map(order => {
                    const shiftLabel = order.shiftType || order.shift_type || 'Evening';
                    const orderBranchId = order.branchId || order.branch_id;
                    return (
                      <tr key={order.id} className="hover:bg-slate-950/50">
                        <td className="p-3 font-bold text-white">#{order.orderNumber}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          <div>{getPakistanDateString(order.createdAt)}</div>
                          <div className="text-slate-500">{formatPakistanTime(order.createdAt)}</div>
                        </td>
                        <td className="p-3 text-slate-200">
                          {order.customerName ? (
                            <div>
                              <div className="font-bold text-white flex items-center gap-1">
                                <User className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="text-[10px] text-amber-400 font-mono font-semibold flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>{order.customerPhone}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Walk-in Guest</span>
                          )}
                        </td>
                        <td className="p-3 text-rose-400 font-semibold">
                          {(orderBranchId === 'branch-def' || orderBranchId?.includes('def')) ? 'Defence' : 'Qasimabad'}
                        </td>
                        <td className="p-3 font-extrabold text-amber-400">T-{order.tableNumber}</td>
                        <td className="p-3 font-bold text-slate-300">
                          <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] text-rose-400 font-bold block w-fit">
                            {shiftLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            order.payment === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {order.payment || 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-[200px] truncate">
                          {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Item Order'}
                        </td>
                        <td className="p-3 font-extrabold text-white">PKR {order.totalAmount}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-extrabold ${
                            order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400' :
                            order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                            order.status === 'served' ? 'bg-purple-500/20 text-purple-400' :
                            order.status === 'completed' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleAdminDirectCancelOrder(order.id)}
                              className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded-lg text-[11px] font-bold transition"
                            >
                              Cancel Direct
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAY-BY-DAY, WEEKLY & MONTHLY SALES MATRIX */}
      {activeTab === "daily_weekly" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Permanent Historical Sales & Revenue Ledger (Day & Month Breakdown)
              </h2>
              <p className="text-xs text-slate-400">
                Har din ki sales, completed orders, complaints aur har shift (Morning, Evening, Night) ka permanent record.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Ledger CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Total Revenue ({periodType.toUpperCase()})</span>
              <div className="text-2xl font-black text-amber-400">PKR {totalSystemRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Completed Orders</span>
              <div className="text-2xl font-black text-emerald-400">{completedOrdersList.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Active Days in Scope</span>
              <div className="text-2xl font-black text-blue-400">{dailyBreakdown.length} Days</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Average Daily Sales</span>
              <div className="text-2xl font-black text-purple-400">
                PKR {dailyBreakdown.length > 0 ? Math.round(totalSystemRevenue / dailyBreakdown.length).toLocaleString() : 0}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                Day-By-Day Sales & Shift Performance Matrix
              </h3>
              <span className="text-xs text-slate-500 font-mono">Showing {dailyBreakdown.length} recorded dates</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-3">Date (Din)</th>
                    <th className="p-3 text-amber-400">Morning Shift</th>
                    <th className="p-3 text-rose-400">Evening Shift</th>
                    <th className="p-3 text-blue-400">Night Shift</th>
                    <th className="p-3">Completed Orders</th>
                    <th className="p-3 text-emerald-400 font-bold">Total Daily Revenue</th>
                    <th className="p-3">Complaints</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dailyBreakdown.map(day => (
                    <tr key={day.dateStr} className="hover:bg-slate-950/50">
                      <td className="p-3 font-bold text-white font-mono">
                        <div className="text-xs">{day.dateStr}</div>
                        <div className="text-[10px] text-slate-500">
                          {day.dateStr === todayStr ? '⭐ Today (Aaj)' : new Date(day.dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        <div className="font-bold text-amber-300">PKR {day.morningSales.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{day.morningOrders} orders</div>
                      </td>
                      <td className="p-3 text-slate-300">
                        <div className="font-bold text-rose-300">PKR {day.eveningSales.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{day.eveningOrders} orders</div>
                      </td>
                      <td className="p-3 text-slate-300">
                        <div className="font-bold text-blue-300">PKR {day.nightSales.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{day.nightOrders} orders</div>
                      </td>
                      <td className="p-3 font-black text-slate-200">
                        {day.completedCount} orders
                        {day.cancelledCount > 0 && <span className="text-[10px] text-rose-400 ml-1">({day.cancelledCount} cancelled)</span>}
                      </td>
                      <td className="p-3 font-black text-emerald-400 text-sm">
                        PKR {day.totalRevenue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        {day.complaintsCount > 0 ? (
                          <span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {day.complaintsCount} Complaints
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Clean (0)</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-mono">
                          Saved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLETED ORDERS PERMANENT ARCHIVE */}
      {activeTab === "completed_archive" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Permanent Completed Orders Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Full historical log of all finished and paid orders with date, time, shift code, items, and customer info.
              </p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search order #, customer, item..."
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400 font-bold">
                Showing {searchedCompletedOrders.length} completed transactions
              </span>
              <span className="text-xs font-black text-amber-400">
                Sum Total: PKR {searchedCompletedOrders.reduce((s, o) => s + (Number(o.totalAmount || o.total_amount) || 0), 0).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-3">Order #</th>
                    <th className="p-3">Date & Exact Time</th>
                    <th className="p-3">Shift Tag & Code</th>
                    <th className="p-3">Branch & Table</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Ordered Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {searchedCompletedOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-950/50">
                      <td className="p-3 font-bold text-white">#{order.orderNumber}</td>
                      <td className="p-3 text-slate-300 font-mono text-[11px]">
                        <div>{formatPakistanDateTime(order.createdAt)}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-amber-400 font-bold font-mono">
                          {order.shiftType || 'Evening'} ({order.shiftId || 'SHIFT'})
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-rose-400 font-bold">
                          {order.branchId === 'branch-def' ? 'Defence' : 'Qasimabad'}
                        </span>
                        <span className="text-slate-400 ml-1">Table {order.tableNumber}</span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {order.customerName ? (
                          <div>
                            <div className="font-bold text-white">{order.customerName}</div>
                            <div className="text-[10px] text-slate-500">{order.customerPhone}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Dine-in Guest</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 max-w-[220px]">
                        {order.items?.map((it, idx) => (
                          <span key={idx} className="inline-block mr-2 text-[11px]">
                            <strong className="text-rose-400">{it.quantity}x</strong> {it.name}
                          </span>
                        ))}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-extrabold">
                          {order.payment || 'Paid'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-amber-400 text-sm">
                        PKR {order.totalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLAINTS MASTER MANAGEMENT LOG */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Permanent Customer Complaints Center
              </h2>
              <p className="text-xs text-slate-400">
                Har shikayat ka Mukammal record: Date, Time, Shift Tag, Table, Branch aur Solution status.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold mr-1">Status:</span>
              {["ALL", "open", "resolved"].map(st => (
                <button
                  key={st}
                  onClick={() => setComplaintFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition border capitalize ${
                    complaintFilterStatus === st
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Total Filtered Complaints</span>
              <div className="text-xl font-black text-white">{filteredComplaints.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Active Open Issues</span>
              <div className="text-xl font-black text-rose-400">
                {filteredComplaints.filter(c => c.status === 'open').length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Resolved Issues</span>
              <div className="text-xl font-black text-emerald-400">
                {filteredComplaints.filter(c => c.status === 'resolved').length}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No customer complaints found for this filtered date & shift window.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredComplaints.map(c => (
                  <div key={c.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-950/40 px-2 rounded-xl transition">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-xs">Table #{c.tableNumber}</span>
                        <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
                          {c.branchId === 'branch-def' ? 'Defence Branch' : 'Qasimabad Branch'}
                        </span>
                        <span className="text-[10px] bg-slate-950 text-amber-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                          {c.shiftType || 'Evening'} Shift
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatPakistanDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed pl-1">
                        "{c.message}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        c.status === 'resolved' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {c.status}
                      </span>
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => resolveComplaint(c.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SHIFT HANDOVER & CLOSING REPORTS */}
      {activeTab === "shift_closing_reports" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Manager Shift Handover & Closing Reports ({filteredReports.length})
              </h2>
              <p className="text-xs text-slate-400">
                Har Shift ka Mukammal closing record: Cash register handover, Total Sales, Orders Count aur Manager Notes.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPeriodType('all');
                  setFilterBranch('ALL');
                  setFilterShift('ALL');
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Show All Shift Reports</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Total Reports in View</span>
              <div className="text-xl font-black text-white">{filteredReports.length}</div>
              <span className="text-[10px] text-slate-500">All shifts & incidents</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Shift Closings Captured</span>
              <div className="text-xl font-black text-emerald-400">
                {filteredReports.filter(r => r.reportType === 'ShiftClosing').length} Closings
              </div>
              <span className="text-[10px] text-slate-500">
                PKR {filteredReports.filter(r => r.reportType === 'ShiftClosing').reduce((sum, r) => sum + (Number(r.totalShiftSales) || 0), 0).toLocaleString()} Total Sales
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold">Incident Logs</span>
              <div className="text-xl font-black text-rose-400">
                {filteredReports.filter(r => r.reportType !== 'ShiftClosing').length} Incidents
              </div>
              <span className="text-[10px] text-slate-500">Maintenance & special notes</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Shift Reports Found for Current Filter</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Jab Manager Panel (<code className="text-amber-400 font-mono">/manager</code>) par Manager <strong>Shift Closing</strong> ka button daba kar report generate karega, to wo yahan live show hogi.
                </p>
                {branchReports.length > 0 && (
                  <button
                    onClick={() => {
                      setPeriodType('all');
                      setFilterBranch('ALL');
                      setFilterShift('ALL');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    View All {branchReports.length} Historical Reports (Reset Filters)
                  </button>
                )}
              </div>
            ) : (
              filteredReports.map(rep => (
                <div key={rep.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-3 shadow-xl transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                        rep.reportType === 'ShiftClosing'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {rep.reportType === 'ShiftClosing' ? 'Shift Closing Handover' : 'Incident Log'}
                      </span>
                      <span className="font-extrabold text-slate-100 text-sm">{rep.shiftName || 'Shift'}</span>
                      <span className="text-xs bg-slate-950 text-amber-400 border border-slate-800 px-2 py-0.5 rounded-lg font-mono font-bold">
                        {rep.branchId === 'branch-def' ? 'Defence Branch' : 'Qasimabad Branch'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Manager: <strong className="text-slate-200">{rep.managerName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatPakistanDateTime(rep.createdAt)}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete this report?`)) {
                            deleteBranchReport(rep.id);
                          }
                        }}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg border border-rose-800 transition"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {rep.reportType === 'ShiftClosing' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Shift Sales</span>
                        <span className="text-base font-black text-emerald-400">PKR {Number(rep.totalShiftSales || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Completed Orders</span>
                        <span className="text-base font-black text-slate-200">{rep.totalOrdersCount || 0} Orders</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Cancelled Orders</span>
                        <span className="text-base font-black text-rose-400">{rep.cancelledOrdersCount || 0}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Handover & Manager Remarks:</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{rep.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SHIFT PERFORMANCE & HANDOVER REPORTS */}
      {activeTab === "shift_analytics" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Shift-Wise Sales & Complaints Breakdown ({periodType.toUpperCase()})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl border-t-4 border-t-amber-400">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Sun className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-100">Morning Shift</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">06:00 AM - 02:00 PM</span>
              </div>
              <div className="text-2xl font-black text-amber-400">PKR {morningStats.sales.toLocaleString()}</div>
              <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                <span>Completed Orders: <strong>{morningStats.count}</strong></span>
                <span>Complaints: <strong className="text-rose-400">{morningStats.complaints}</strong></span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl border-t-4 border-t-rose-500">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-rose-500">
                  <Sunset className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-100">Evening Shift</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">02:00 PM - 10:00 PM</span>
              </div>
              <div className="text-2xl font-black text-rose-400">PKR {eveningStats.sales.toLocaleString()}</div>
              <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                <span>Completed Orders: <strong>{eveningStats.count}</strong></span>
                <span>Complaints: <strong className="text-rose-400">{eveningStats.complaints}</strong></span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl border-t-4 border-t-blue-500">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Moon className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-slate-100">Night Shift</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">10:00 PM - 06:00 AM</span>
              </div>
              <div className="text-2xl font-black text-blue-400">PKR {nightStats.sales.toLocaleString()}</div>
              <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                <span>Completed Orders: <strong>{nightStats.count}</strong></span>
                <span>Complaints: <strong className="text-rose-400">{nightStats.complaints}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
              Permanent Manager Handover & Shift Closing Reports
            </h3>
            <div className="space-y-3">
              {filteredReports.map(rep => (
                <div key={rep.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-400">{rep.shiftName} Handover — Manager: {rep.managerName}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        {rep.branchId === 'branch-def' ? 'Defence' : 'Qasimabad'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{formatPakistanDateTime(rep.createdAt)}</span>
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
                    <div className="flex justify-between font-bold text-emerald-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span>Shift Revenue: PKR {rep.totalShiftSales?.toLocaleString()}</span>
                      <span>Orders Count: {rep.totalOrdersCount}</span>
                      <span>Cancelled Count: {rep.cancelledOrdersCount || 0}</span>
                    </div>
                  )}
                  <p className="text-slate-300">{rep.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MENU & VARIANTS */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Product Catalog & Variant Prices</h2>
            <button
              onClick={() => handleOpenItemModal()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex space-x-3 items-center">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-slate-950 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="text-[10px] text-rose-500 font-bold uppercase">{item.categoryName}</div>
                  <h4 className="font-bold text-xs text-slate-100 leading-snug">{item.name}</h4>
                  <div className="text-xs font-black text-amber-400">
                    PKR {item.price}
                    {item.hasVariants && <span className="text-[10px] text-slate-400 font-normal ml-1">({item.variants?.length} Variants)</span>}
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <button onClick={() => handleOpenItemModal(item)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleItemStock(item.id)} className={`p-1.5 rounded-lg text-[10px] font-extrabold ${item.isOutOfStock ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                    {item.isOutOfStock ? 'OFF' : 'ON'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: STAFF PIN ACCOUNTS */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Kitchen & Manager PIN Accounts</h2>
            <button onClick={() => setIsStaffModalOpen(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow">
              <Plus className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Login PIN Code</th>
                  <th className="p-3">Privacy PIN Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map(st => (
                  <tr key={st.id} className="hover:bg-slate-950/50">
                    <td className="p-3 font-bold text-white">{st.name}</td>
                    <td className="p-3 text-slate-300">{st.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-extrabold ${st.role === 'admin' ? 'bg-rose-950 text-rose-400' : st.role === 'manager' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'}`}>
                        {st.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-semibold">
                      {st.branchId === 'branch-def' ? 'Defence' : st.branchId === 'branch-qas' ? 'Qasimabad' : 'All'}
                    </td>
                    <td className="p-3 font-mono text-amber-400 font-bold">{st.pin}</td>
                    <td className="p-3 font-mono text-rose-400 font-bold">{st.privacyPin || '9999'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: QR GENERATOR */}
      {activeTab === "qr" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 max-w-xl mx-auto shadow-2xl">
          <div className="flex items-center space-x-3 text-rose-500">
            <QrCode className="w-6 h-6" />
            <h2 className="text-base font-extrabold text-slate-100">Table QR Code Link Generator</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Select Branch</label>
              <select value={qrBranch} onChange={e => setQrBranch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                <option value="Defence">Defence Branch</option>
                <option value="Qasimabad">Qasimabad Branch</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Table Number</label>
              <input type="number" min={1} max={50} value={qrTableNum} onChange={e => setQrTableNum(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 text-center">
            <div className="text-xs text-slate-400 font-semibold">Generated QR Menu Direct Link:</div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-rose-400 break-all select-all">
              {generatedQrUrl}
            </div>

            <div className="pt-2 flex justify-center space-x-2">
              <a href={generatedQrUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow">
                Open Table Menu Link
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Date & Shift Order Modification Audit Trail</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-x-auto">
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No Privacy-PIN gated modifications logged yet.</div>
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3">Timestamp / Date</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Shift Tag</th>
                    <th className="p-3">Staff User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-950/50">
                      <td className="p-3 text-slate-500 font-mono">{formatPakistanDateTime(log.createdAt)}</td>
                      <td className="p-3 text-slate-400 font-semibold">
                        {log.branchId === 'branch-def' ? 'Defence' : log.branchId === 'branch-qas' ? 'Qasimabad' : '—'}
                      </td>
                      <td className="p-3 font-bold text-amber-400">{log.shiftType || 'Evening'} ({log.shiftId || 'SHIFT'})</td>
                      <td className="p-3 font-bold text-white">{log.performedBy}</td>
                      <td className="p-3 text-rose-400 font-semibold">{log.role}</td>
                      <td className="p-3 font-extrabold text-rose-400">{log.actionType}</td>
                      <td className="p-3 text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-rose-400">{editingItem ? "Edit Product" : "Add New Menu Product"}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveItemSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Product Name</label>
                <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" required />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Category</label>
                <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                  {SEED_DATA.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Base Price (PKR)</label>
                <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" required />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Image Picture URL</label>
                <input type="text" value={itemImage} onChange={e => setItemImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input type="checkbox" id="variantCheck" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} className="rounded border-slate-700 bg-slate-950 text-rose-600" />
                <label htmlFor="variantCheck" className="text-xs text-slate-300 font-semibold">Enable Size / Portion Variant Pricing</label>
              </div>
              {hasVariants && (
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block">Variant Type</label>
                  <select value={variantType} onChange={e => setVariantType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                    <option value="size">Pizza Size (Small, Medium, Large)</option>
                    <option value="portion">Dish Portion (Half, Full)</option>
                  </select>
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl shadow">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-rose-400">Create Staff PIN Account</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateStaffSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Staff Full Name</label>
                <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" required />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Username</label>
                <input type="text" value={newStaffUser} onChange={e => setNewStaffUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" required />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Assign Security PIN</label>
                <input type="text" value={newStaffPin} onChange={e => setNewStaffPin(e.target.value)} placeholder="e.g. 5555" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono" required />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Role</label>
                <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="manager">Branch Manager</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl shadow">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ShiftChangeNotification 
        previousShift={previousShift} 
        currentShift={currentShift}
      />
    </div>
  );
};
