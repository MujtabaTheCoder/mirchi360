import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import {
  Flame, ShoppingBag, Bell, AlertCircle, Check, Plus, Minus, X,
  Clock, Sparkles, ChefHat, MessageSquare, ChevronRight, CheckCircle, Search, Utensils, History,
  User, Phone, Globe
} from 'lucide-react';
import { useApp, formatPakistanTime } from '../../lib/store';
import { getBranchUuid } from '../../lib/supabase';
import { CustomerIdentityModal } from './CustomerIdentityModal';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { sanitizeTextInput } from '../../lib/security';
import { useMenuItems } from '../../hooks/useMenuItems';

// ── Memoized sub-components to prevent re-renders from timer ticks ──────────

const MenuItemCard = memo(({ item, onAdd, cartQuantity = 0, onUpdateQuantity }) => {
  const hasVariants = Boolean(item.hasVariants || item.has_variants || (item.variants && item.variants.length > 0));
  const isOutOfStock = Boolean(item.isOutOfStock || item.is_out_of_stock);
  const price = item.price || 0;
  const image = item.image || item.image_url;
  const categoryName = item.categoryName || item.category_name;

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onAdd(item);
      }}
      className={`menu-card bg-slate-900/90 border rounded-2xl p-3 flex space-x-3 transition relative overflow-hidden cursor-pointer select-none ${isOutOfStock
          ? 'border-slate-800/80 opacity-60 grayscale cursor-not-allowed'
          : 'border-slate-800 hover:border-rose-500/60 hover:bg-slate-900/95 active:scale-[0.99] shadow-lg hover:shadow-rose-950/20'
        }`}
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 relative">
        <img src={image} alt={item.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-1">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter text-center">Sold Out</span>
          </div>
        )}
        {cartQuantity > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-md flex items-center space-x-0.5 animate-in zoom-in-50">
            <span>{cartQuantity} in cart</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{categoryName}</div>
          <h3 className="font-bold text-sm text-slate-100 line-clamp-1 leading-snug">{item.name}</h3>
          <div className="text-xs font-black text-amber-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>PKR {price}</span>
            {hasVariants && <span className="text-[10px] text-slate-400 font-normal">(Variants available)</span>}
          </div>
        </div>
        <div className="pt-2 flex justify-end items-center">
          {isOutOfStock ? (
            <span className="px-3 py-1 bg-slate-800 text-slate-500 rounded-lg text-xs font-semibold">
              Unavailable
            </span>
          ) : cartQuantity > 0 && !hasVariants ? (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center space-x-1.5 bg-slate-950 border border-rose-500/40 p-1 rounded-xl shadow-md"
            >
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center transition active:scale-95 text-xs font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-white px-1.5">{cartQuantity}</span>
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="w-6 h-6 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center transition active:scale-95 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="gpu-accelerate px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md shadow-rose-900/50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{hasVariants ? 'Select Size' : 'Add'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
MenuItemCard.displayName = 'MenuItemCard';

const OrderStatusBadge = memo(({ status }) => (
  <div className={`status-badge px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5 ${status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
      status === 'preparing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
        status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce' :
          status === 'served' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
            'bg-slate-800 text-slate-400'
    }`}>
    {status === 'pending' && <Clock className="w-3.5 h-3.5" />}
    {status === 'preparing' && <ChefHat className="w-3.5 h-3.5 text-blue-400" />}
    {status === 'ready' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
    {status === 'served' && <Utensils className="w-3.5 h-3.5 text-purple-400" />}
    <span>{status}</span>
  </div>
));
OrderStatusBadge.displayName = 'OrderStatusBadge';

// ── Main Component ───────────────────────────────────────────────────────────

export const CustomerApp = () => {
  const { t, i18n } = useTranslation();
  const {
    selectedBranch,
    selectedTableNumber,
    createOrder,
    orders,
    submitComplaint,
    callWaiter
  } = useApp();

  const { data: menuItems, isLoading: isMenuLoading } = useMenuItems();

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [activeTab, setActiveTab] = useState("menu");

  // Modal States
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showPastHistory, setShowPastHistory] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [customerIdentity, setCustomerIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_customer_identity');
      return saved ? JSON.parse(saved) : { name: "", phone: "", skipped: false };
    } catch {
      return { name: "", phone: "", skipped: false };
    }
  });

  // Variant selection state modal
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // ── Memoized derived state (no recalc unless inputs change) ─────────────
  const categories = useMemo(
    () => ["ALL", ...new Set((menuItems || []).map(item => item?.categoryName || item?.category_name).filter(Boolean))],
    [menuItems]
  );

  const filteredItems = useMemo(() => (menuItems || []).filter(item => {
    if (!item) return false;
    const itemName = item.name || '';
    const itemCat = item.categoryName || item.category_name || '';
    const query = (searchQuery || '').toLowerCase();
    const matchesCat = activeCategory === "ALL" || itemCat === activeCategory;
    const matchesSearch = itemName.toLowerCase().includes(query) || itemCat.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  }), [menuItems, activeCategory, searchQuery]);

  const allTableOrders = useMemo(() => (orders || []).filter(o => {
    if (!o) return false;
    const matchTable = Number(o.tableNumber || o.table_number) === Number(selectedTableNumber);
    const branchSlug = selectedBranch?.id || 'branch-def';
    const branchUuid = getBranchUuid(branchSlug);
    const matchBranch = !branchSlug ||
      o.branchId === branchSlug ||
      o.branch_id === branchSlug ||
      o.branchId === branchUuid ||
      o.branch_id === branchUuid;
    return matchTable && matchBranch;
  }), [orders, selectedTableNumber, selectedBranch?.id]);

  const activeTableOrders = useMemo(() => allTableOrders.filter(o =>
    o &&
    o.status !== 'completed' &&
    o.status !== 'cancelled' &&
    o.payment !== 'Paid'
  ), [allTableOrders]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [cart]);

  const cartItemCounts = useMemo(() => {
    const counts = {};
    (cart || []).forEach(item => {
      counts[item.itemId] = (counts[item.itemId] || 0) + (Number(item.quantity) || 1);
    });
    return counts;
  }, [cart]);

  // ── Stable callback refs (no re-creation on re-render) ──────────────────
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }, []);

  const handleAddToCart = useCallback((item, variant = null) => {
    if (!item) return;
    const isOutOfStock = Boolean(item.isOutOfStock || item.is_out_of_stock);
    if (isOutOfStock) return;

    const hasVariants = Boolean(item.hasVariants || item.has_variants || (item.variants && item.variants.length > 0));

    if (hasVariants && !variant) {
      setSelectedItemForVariant(item);
      const firstVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
      setSelectedVariant(firstVariant);
      return;
    }

    const itemPrice = Number(variant ? variant.price : item.price) || 0;
    const itemKey = variant ? `${item.id}-${variant.name}` : item.id;

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === itemKey);
      let updated;
      if (existing) {
        updated = prev.map(i => i.cartKey === itemKey ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * itemPrice } : i);
      } else {
        updated = [...prev, {
          cartKey: itemKey,
          itemId: item.id,
          name: item.name,
          variantName: variant ? variant.name : null,
          unitPrice: itemPrice,
          quantity: 1,
          subtotal: itemPrice,
          specialNotes: ""
        }];
      }
      try { localStorage.setItem('mirchi_cart_items', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setSelectedItemForVariant(null);
    setSelectedVariant(null);
    const label = variant ? `${item.name} (${variant.name})` : item.name;
    showToast(`✓ Added ${label} to cart`);
  }, [showToast]);

  const updateCartQuantity = useCallback((cartKey, delta) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.cartKey === cartKey || item.itemId === cartKey) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
        }
        return item;
      }).filter(Boolean);
      try { localStorage.setItem('mirchi_cart_items', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const updateItemNotes = useCallback((cartKey, notes) => {
    setCart(prev => {
      const updated = prev.map(item => item.cartKey === cartKey ? { ...item, specialNotes: notes } : item);
      try { localStorage.setItem('mirchi_cart_items', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const executeOrderSubmission = useCallback(async (name, phone) => {
    if (cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
      const finalName = name?.trim() || `Table ${selectedTableNumber} Guest`;
      const cleanPhone = phone?.trim() || "";
      const cleanNotes = sanitizeTextInput(orderNotes, 300);

      const confirmedOrder = await createOrder({
        items: cart,
        totalAmount: cartTotal,
        notes: cleanNotes,
        customerName: finalName,
        customerPhone: cleanPhone
      });

      try {
        localStorage.setItem('mirchi_customer_identity', JSON.stringify({ name: finalName, phone: cleanPhone, skipped: true }));
        localStorage.removeItem('mirchi_cart_items');
      } catch { }

      setCart([]);
      setOrderNotes("");
      setIsCartOpen(false);
      setIsIdentityModalOpen(false);
      setActiveTab("tracking");

      const assignedNumber = confirmedOrder?.orderNumber || confirmedOrder?.order_number || "Active";
      showToast(`🎉 Order #${assignedNumber} placed! (Table ${selectedTableNumber})`);
    } catch (err) {
      console.error("Order submission error:", err);
      showToast("Connection issue. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [cart, cartTotal, createOrder, orderNotes, selectedTableNumber, showToast, isSubmittingOrder]);

  const handlePlaceOrder = useCallback(async () => {
    if (cart.length === 0 || isSubmittingOrder) return;
    const trimmedName = sanitizeTextInput(customerIdentity.name || "", 80);
    const trimmedPhone = sanitizeTextInput(customerIdentity.phone || "", 30);
    await executeOrderSubmission(trimmedName, trimmedPhone);
  }, [cart.length, isSubmittingOrder, customerIdentity, executeOrderSubmission]);

  const handleIdentitySave = useCallback(async (identity) => {
    const cleanName = sanitizeTextInput(identity?.name || "", 80);
    const cleanPhone = sanitizeTextInput(identity?.phone || "", 30);
    const cleanIdentity = { name: cleanName, phone: cleanPhone, skipped: true };
    setCustomerIdentity(cleanIdentity);
    try { localStorage.setItem('mirchi_customer_identity', JSON.stringify(cleanIdentity)); } catch { }
    setIsIdentityModalOpen(false);
    if (cart.length > 0) {
      await executeOrderSubmission(cleanName, cleanPhone);
    }
  }, [cart.length, executeOrderSubmission]);

  const handleCallWaiterClick = useCallback(() => {
    callWaiter("Customer requested assistance");
    showToast("Waiter alert sent! A team member is on their way to Table " + selectedTableNumber + ".");
  }, [callWaiter, selectedTableNumber, showToast]);

  const handleComplaintSubmit = useCallback((e) => {
    e.preventDefault();
    const cleanComplaint = sanitizeTextInput(complaintText, 500);
    if (!cleanComplaint) return;
    submitComplaint(cleanComplaint);
    setComplaintText("");
    setIsComplaintModalOpen(false);
    showToast("Complaint sent directly to Branch Manager.");
  }, [complaintText, submitComplaint, showToast]);



  const isAnyModalOpen = Boolean(
    isCartOpen ||
    isComplaintModalOpen ||
    selectedItemForVariant ||
    isIdentityModalOpen
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isAnyModalOpen]);

  return (
    <div className="h-[100dvh] h-screen w-screen max-w-full flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-gradient-to-r from-rose-600 to-amber-600 text-white px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top duration-300 pointer-events-none">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header (Fixed & Stationary — stays firmly anchored on screen) */}
      <header className="flex-shrink-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 flex-shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">MIRCHI 360</h1>
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-rose-400 font-semibold flex-wrap">
                <span className="bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {selectedBranch?.name || 'Defence'} Branch
                </span>
                <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                  TABLE {selectedTableNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-gradient-to-r from-rose-600/20 to-amber-500/20 hover:from-rose-600/30 hover:to-amber-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              title="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline font-extrabold text-white">{t('Cart', 'Cart')}</span>
              {cartItemCount > 0 ? (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow animate-pulse">
                  {cartItemCount}
                </span>
              ) : null}
            </button>
            <a
              href="/staff"
              className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
              title="Staff Portal"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden md:inline font-bold">{t('Staff', 'Staff')}</span>
            </a>
            <button
              type="button"
              onClick={handleCallWaiterClick}
              className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
              title="Call Waiter"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="hidden md:inline font-bold">{t('Call Waiter', 'Call Waiter')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsComplaintModalOpen(true)}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
              title="Manager Complaint"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline font-bold">{t('Complain', 'Complain')}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Menu vs Active Orders) */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${activeTab === "menu" ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('Digital Menu', 'Digital Menu')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition relative flex items-center justify-center gap-1.5 ${activeTab === "tracking" ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t('Active Orders', 'Active Orders')} ({activeTableOrders.length})</span>
              {activeTableOrders.some(o => o.status === 'ready' || o.status === 'preparing') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar & Category Horizontal Scroll Slider (Fixed at top with header) */}
        {activeTab === "menu" && (
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-2.5 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search food, steaks, handi, karahi, drinks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Horizontal Scroll Slider */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition border ${activeCategory === cat
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500 shadow-md shadow-rose-900/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Scrollview Area (ONLY items or active orders scroll inside here!) */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 lg:px-6 py-4 scroll-smooth">
        <ErrorBoundary sectionName="Customer View">
          {activeTab === "menu" ? (
            <div className="w-full max-w-7xl mx-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-3 bg-slate-900/50 border border-slate-800/60 rounded-3xl p-8 max-w-md mx-auto">
                  <Utensils className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No items match your search or filter</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setActiveCategory("ALL"); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-xl transition"
                  >
                    Clear Search & Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 pb-28">
                  {filteredItems.map((item) => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      onAdd={handleAddToCart}
                      cartQuantity={cartItemCounts[item.id] || 0}
                      onUpdateQuantity={updateCartQuantity}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Live Order Tracking View (Inside the same scroll container) */
            <div className="w-full max-w-3xl mx-auto space-y-4 pb-28">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-rose-500" />
                  <span>Active Orders (Table {selectedTableNumber})</span>
                </h2>
              </div>

              {/* If no active orders currently running */}
              {activeTableOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-100 text-sm">No Active Orders In Progress!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All previous orders have been completed and bill paid. Ready for your next delicious meal?
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-2xl shadow-lg transition active:scale-95 inline-flex items-center space-x-2"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Browse Menu & Place New Order</span>
                  </button>
                </div>
              ) : (
                activeTableOrders.map((order) => {
                  const estMins = order.estimatedMinutes || order.estimated_minutes;

                  return (
                    <div
                      key={order.id}
                      className="order-card bg-slate-900 border border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-2xl border-l-4 border-l-rose-500"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400 font-semibold">ORDER</span>
                            <span className="text-base font-extrabold text-white">#{order.orderNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Placed at {formatPakistanTime(order.createdAt)}
                          </div>
                        </div>
                        {/* Status Badge */}
                        <OrderStatusBadge status={order.status} />
                      </div>

                      {/* 1. If preparing: Show Kitchen Preparation Timer */}
                      {order.status === 'preparing' && estMins ? (
                        <div className="bg-gradient-to-r from-amber-950/80 via-rose-950/80 to-slate-900 border border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
                          <div className="flex items-center space-x-2.5 text-amber-300">
                            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Kitchen Preparation Time:</div>
                              <div className="text-xs text-slate-200 font-medium">Chef is preparing your meal fresh</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-amber-300 bg-amber-900/80 border border-amber-500/60 px-3 py-1.5 rounded-xl shadow inline-block">
                              ~{estMins} MINS
                            </span>
                          </div>
                        </div>
                      ) : order.status === 'pending' ? (
                        /* 2. If pending: Show Kitchen received message */
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 flex items-center space-x-2">
                          <Clock className="w-4 h-4 flex-shrink-0 animate-spin" />
                          <span>Order received by kitchen. Chef will set estimated preparation time shortly...</span>
                        </div>
                      ) : order.status === 'ready' ? (
                        /* 3. If ready: Show Order Ready Banner */
                        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
                          <div className="flex items-center space-x-2.5 text-emerald-300">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-emerald-400">Order is Ready!</div>
                              <div className="text-[11px] text-slate-300">Your meal is ready and is being served to your table now.</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase whitespace-nowrap">
                            Ready
                          </span>
                        </div>
                      ) : order.status === 'served' ? (
                        /* 4. If served: Show Served Banner & PROMINENT BILL UNPAID OPTION */
                        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-amber-950/80 border border-purple-500/40 p-3.5 rounded-2xl space-y-2 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 text-purple-300">
                              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                                <Utensils className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-black uppercase tracking-wider text-white">Order Served — Enjoy Your Meal!</div>
                                <div className="text-[11px] text-slate-300">Delivered to Table {order.tableNumber}.</div>
                              </div>
                            </div>
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wide">
                              Bill: Unpaid
                            </span>
                          </div>

                          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Total Bill to Pay:</span>
                            <span className="text-base font-black text-amber-400">PKR {order.totalAmount}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic text-center">
                            Please pay the bill to your server or at the cashier counter.
                          </p>
                        </div>
                      ) : null}

                      {/* Items Summary */}
                      <div className="space-y-1.5 py-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-300">
                            <span>{item.quantity}x {item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                            <span className="font-semibold text-slate-400">PKR {item.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Total Bill: </span>
                          <span className="text-base font-extrabold text-rose-400 ml-1">PKR {order.totalAmount}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${order.payment === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                          {order.payment === 'Paid' ? '✓ Paid' : 'Bill: Unpaid'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Floating Cart Button (Elevated and Responsive) */}
      {cart.length > 0 && activeTab === "menu" && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold p-3.5 rounded-2xl shadow-2xl shadow-rose-950/80 flex items-center justify-between transition transform active:scale-98 border border-rose-400/30"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 px-2.5 py-1 rounded-xl text-xs font-black">
                  {cart.reduce((a, b) => a + b.quantity, 0)} Items
                </div>
                <span className="text-sm tracking-wide">Review & Place Order</span>
              </div>
              <div className="flex items-center space-x-2 text-sm font-black">
                <span>PKR {cartTotal}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal — Center in front of screen, lock background scroll */}
      {isCartOpen && (
        <div 
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-lg sm:max-w-xl rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 relative"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-100 text-sm">Draft Cart (Table {selectedTableNumber})</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCartOpen(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto overscroll-contain flex-1 space-y-3">
              {cart.map((item) => (
                <div key={item.cartKey} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-100">{item.name}</h4>
                      {item.variantName && (
                        <span className="text-[11px] text-rose-400 font-semibold">{item.variantName}</span>
                      )}
                      <div className="text-xs text-amber-400 font-bold mt-0.5">PKR {item.unitPrice}</div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, -1)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartKey, 1)}
                        className="p-1 text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Special instructions (e.g. extra spicy, no onion)"
                    value={item.specialNotes}
                    onChange={(e) => updateItemNotes(item.cartKey, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-rose-500"
                  />
                </div>
              ))}

              {/* Customer Name & Phone Input Block */}
              <div className="pt-2 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-500" />
                    <span>Customer Details (Optional)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Table {selectedTableNumber}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder={`e.g. Table ${selectedTableNumber} Guest`}
                      value={customerIdentity.name}
                      onChange={e => setCustomerIdentity(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="03001234567"
                      value={customerIdentity.phone}
                      onChange={e => setCustomerIdentity(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="text-xs font-semibold text-slate-400 block mb-1">Order Special Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring extra cutlery immediately."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex-shrink-0 space-y-3">
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span className="text-slate-300">Total Payable:</span>
                <span className="text-rose-400 text-lg">PKR {cartTotal}</span>
              </div>
              <button
                type="button"
                disabled={isSubmittingOrder || cart.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
              >
                {isSubmittingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Order to Kitchen...</span>
                  </>
                ) : (
                  <span>Send Order to Kitchen</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal — Center in front of screen */}
      {selectedItemForVariant && (
        <div 
          onClick={() => {
            setSelectedItemForVariant(null);
            setSelectedVariant(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 relative"
          >
            <div className="flex-shrink-0 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{selectedItemForVariant.categoryName || selectedItemForVariant.category_name}</span>
                <h3 className="font-bold text-sm text-slate-100">Select Size/Portion for {selectedItemForVariant.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedItemForVariant(null);
                  setSelectedVariant(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto overscroll-contain pr-1 flex-1">
              {(selectedItemForVariant.variants || []).map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold flex justify-between items-center transition ${selectedVariant?.name === v.name
                    ? 'bg-rose-950/80 border-rose-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedVariant?.name === v.name ? 'border-rose-500 bg-rose-500' : 'border-slate-600'}`}>
                      {selectedVariant?.name === v.name && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span>{v.name}</span>
                  </div>
                  <span className="text-amber-400 font-extrabold">PKR {v.price}</span>
                </button>
              ))}
            </div>

            <div className="flex space-x-2 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemForVariant(null);
                  setSelectedVariant(null);
                }}
                className="flex-1 py-2.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const variantToUse = selectedVariant || (selectedItemForVariant.variants && selectedItemForVariant.variants.length > 0 ? selectedItemForVariant.variants[0] : null);
                  handleAddToCart(selectedItemForVariant, variantToUse);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl shadow-lg transition active:scale-95"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal — Center in front of screen */}
      {isComplaintModalOpen && (
        <div 
          onClick={() => setIsComplaintModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md p-5 space-y-3 shadow-2xl animate-in zoom-in-95 duration-150 relative"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Submit Complaint (Table {selectedTableNumber})</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsComplaintModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">This message will immediately alert the Branch Manager on duty.</p>
            <textarea
              rows={3}
              placeholder="Write issue details (e.g. food delay, wrong item served)..."
              value={complaintText}
              onChange={e => setComplaintText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsComplaintModalOpen(false)}
                className="flex-1 py-2.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplaintSubmit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl shadow-lg transition active:scale-95"
              >
                Send Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Identity Modal */}
      <CustomerIdentityModal
        initialName={customerIdentity.name}
        initialPhone={customerIdentity.phone}
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        onSave={handleIdentitySave}
      />
    </div>
  );
};
