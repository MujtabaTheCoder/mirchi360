import React, { useState } from 'react';
import { 
  Flame, ShoppingBag, Bell, AlertCircle, Check, Plus, Minus, X, 
  Clock, Sparkles, ChefHat, MessageSquare, ChevronRight, CheckCircle, Search, Utensils, History,
  User, Phone
} from 'lucide-react';
import { useApp, formatPakistanTime } from '../../lib/store';
import { CustomerIdentityModal } from './CustomerIdentityModal';

export const CustomerApp = () => {
  const { 
    selectedBranch, 
    selectedTableNumber, 
    menuItems, 
    createOrder, 
    orders, 
    submitComplaint, 
    callWaiter 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [activeTab, setActiveTab] = useState("menu");

  // Modal States
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showPastHistory, setShowPastHistory] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [customerIdentity, setCustomerIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_customer_identity');
      return saved ? JSON.parse(saved) : { name: "", phone: "" };
    } catch {
      return { name: "", phone: "" };
    }
  });

  // Variant selection state modal
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Filter categories
  const categories = ["ALL", ...new Set(menuItems.map(item => item.categoryName))];

  // Filtered Menu Items
  const filteredItems = menuItems.filter(item => {
    const matchesCat = activeCategory === "ALL" || item.categoryName === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter orders for THIS table & branch
  const allTableOrders = orders.filter(o => Number(o.tableNumber) === Number(selectedTableNumber) && o.branchId === selectedBranch.id);
  
  // ACTIVE ORDERS (pending, preparing, ready) vs COMPLETED/PAST ORDERS
  const activeTableOrders = allTableOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pastTableOrders = allTableOrders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  // Add Item to Cart
  const handleAddToCart = (item, variant = null) => {
    if (item.isOutOfStock) return;

    if (item.hasVariants && !variant) {
      setSelectedItemForVariant(item);
      setSelectedVariant(item.variants ? item.variants[0] : null);
      return;
    }

    const itemPrice = variant ? variant.price : item.price;
    const itemKey = variant ? `${item.id}-${variant.name}` : item.id;

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === itemKey);
      if (existing) {
        return prev.map(i => i.cartKey === itemKey ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * itemPrice } : i);
      }
      return [...prev, {
        cartKey: itemKey,
        itemId: item.id,
        name: item.name,
        variantName: variant ? variant.name : null,
        unitPrice: itemPrice,
        quantity: 1,
        subtotal: itemPrice,
        specialNotes: ""
      }];
    });

    setSelectedItemForVariant(null);
    setSelectedVariant(null);

    showToast(`Added ${item.name} to cart`);
  };

  const updateCartQuantity = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
      }
      return item;
    }).filter(Boolean));
  };

  const updateItemNotes = (cartKey, notes) => {
    setCart(prev => prev.map(item => item.cartKey === cartKey ? { ...item, specialNotes: notes } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    
    const trimmedName = (customerIdentity.name || "").trim();
    const trimmedPhone = (customerIdentity.phone || "").trim();

    // Check if customer identity is set
    if (!trimmedName || !trimmedPhone) {
      setIsIdentityModalOpen(true);
      return;
    }
    
    const newOrd = createOrder({
      items: cart,
      totalAmount: cartTotal,
      notes: orderNotes,
      customerName: trimmedName,
      customerPhone: trimmedPhone
    });

    try {
      localStorage.setItem('mirchi_customer_identity', JSON.stringify({ name: trimmedName, phone: trimmedPhone }));
    } catch {}

    setCart([]);
    setOrderNotes("");
    setIsCartOpen(false);
    setActiveTab("tracking");
    showToast(`Order #${newOrd.orderNumber} placed! Name: ${trimmedName}`);
  };

  const handleIdentitySave = (identity) => {
    setCustomerIdentity(identity);
    try {
      localStorage.setItem('mirchi_customer_identity', JSON.stringify(identity));
    } catch {}
    setIsIdentityModalOpen(false);
    // Now proceed with order placement
    if (cart.length > 0) {
      const newOrd = createOrder({
        items: cart,
        totalAmount: cartTotal,
        notes: orderNotes,
        customerName: identity.name,
        customerPhone: identity.phone
      });

      setCart([]);
      setOrderNotes("");
      setIsCartOpen(false);
      setActiveTab("tracking");
      showToast(`Order #${newOrd.orderNumber} placed! Name: ${identity.name}`);
    }
  };

  const handleCallWaiterClick = () => {
    callWaiter("Customer requested assistance");
    showToast("Waiter alert sent! A team member is on their way to Table " + selectedTableNumber + ".");
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    submitComplaint(complaintText);
    setComplaintText("");
    setIsComplaintModalOpen(false);
    showToast("Complaint sent directly to Branch Manager.");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 relative font-sans overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-rose-600 to-amber-600 text-white px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">MIRCHI 360</h1>
              <div className="flex items-center space-x-2 text-xs text-rose-400 font-semibold">
                <span className="bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
                  {selectedBranch.name} Branch
                </span>
                <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                  TABLE {selectedTableNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Call Waiter & Complaint Quick Actions */}
          <div className="flex items-center space-x-2">
            <a
              href="/staff"
              className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Staff</span>
            </a>
            <button
              onClick={handleCallWaiterClick}
              className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="hidden sm:inline font-bold">Call Waiter</span>
            </button>
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-95 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">Complain</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Menu vs Active Orders) */}
        <div className="max-w-xl mx-auto flex mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-hidden">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "menu" ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Menu
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition relative ${
              activeTab === "tracking" ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Orders ({activeTableOrders.length})
            {activeTableOrders.some(o => o.status === 'ready' || o.status === 'preparing') && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {activeTab === "menu" ? (
          <>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search food, steaks, handi, karahi, drinks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 transition shadow-inner"
              />
            </div>

            {/* Category Horizontal Scroll Slider */}
            <div className="flex space-x-2 overflow-x-auto pb-3 mb-4 no-scrollbar touch-pan-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition border ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500 shadow-md shadow-rose-900/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-2xl p-3 flex space-x-3 transition relative overflow-hidden ${
                    item.isOutOfStock
                      ? 'border-slate-800/80 opacity-60 grayscale'
                      : 'border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {/* Item Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {item.isOutOfStock && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-1">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter text-center">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                        {item.categoryName}
                      </div>
                      <h3 className="font-bold text-sm text-slate-100 line-clamp-1 leading-snug">
                        {item.name}
                      </h3>
                      <div className="text-xs font-black text-amber-400 mt-1">
                        PKR {item.price}
                        {item.hasVariants && <span className="text-[10px] text-slate-400 font-normal ml-1">(Variants available)</span>}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <div className="pt-2 flex justify-end">
                      {item.isOutOfStock ? (
                        <button
                          disabled
                          className="px-3 py-1 bg-slate-800 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md shadow-rose-900/50 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{item.hasVariants ? 'Select Size' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Live Order Tracking View (Focusing on ACTIVE ORDERS) */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <ChefHat className="w-4 h-4 text-rose-500" />
                <span>Active Orders (Table {selectedTableNumber})</span>
              </h2>

              {pastTableOrders.length > 0 && (
                <button
                  onClick={() => setShowPastHistory(prev => !prev)}
                  className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center space-x-1 transition bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{showPastHistory ? 'Hide Completed' : `View Past (${pastTableOrders.length})`}</span>
                </button>
              )}
            </div>

            {/* If no active orders currently running */}
            {activeTableOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="font-extrabold text-slate-100 text-sm">No Active Orders In Progress!</h3>
                <p className="text-xs text-slate-400">All previous orders have been completed and served. Ready for your next delicious meal?</p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg transition"
                >
                  Browse Menu & Place New Order
                </button>
              </div>
            ) : (
              activeTableOrders.map((order) => {
                const estMins = order.estimatedMinutes || order.estimated_minutes;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-2xl border-l-4 border-l-rose-500"
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
                      <div className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5 ${
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                        order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce' :
                        order.status === 'served' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {order.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {order.status === 'preparing' && <ChefHat className="w-3.5 h-3.5 text-blue-400" />}
                        {order.status === 'ready' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        {order.status === 'served' && <Utensils className="w-3.5 h-3.5 text-purple-400" />}
                        <span>{order.status}</span>
                      </div>
                    </div>

                    {/* PROMINENT KITCHEN ESTIMATED PREPARATION TIME BANNER */}
                    {estMins && order.status !== 'completed' && order.status !== 'cancelled' ? (
                      <div className="bg-gradient-to-r from-amber-950/80 via-rose-950/80 to-slate-900 border border-amber-500/50 p-3 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
                        <div className="flex items-center space-x-2 text-amber-300">
                          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Kitchen Preparation Time:</div>
                            <div className="text-xs text-slate-200 font-medium">Chef is preparing your meal</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-300 bg-amber-900/80 border border-amber-500/60 px-3 py-1 rounded-xl shadow inline-block">
                            ~{estMins} MINS
                          </span>
                        </div>
                      </div>
                    ) : order.status === 'pending' ? (
                      <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 flex items-center space-x-2">
                        <Clock className="w-4 h-4 flex-shrink-0 animate-spin" />
                        <span>Order received by kitchen. Chef will set estimated preparation time shortly...</span>
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

                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Total Bill Amount:</span>
                      <span className="text-base font-extrabold text-rose-400">PKR {order.totalAmount}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* PAST COMPLETED ORDERS SECTION (Collapsible) */}
            {showPastHistory && pastTableOrders.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed / Past Orders</h3>
                {pastTableOrders.map((order) => (
                  <div key={order.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 space-y-2 opacity-75">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">Order #{order.orderNumber}</span>
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      {order.items?.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{i.quantity}x {i.name}</span>
                          <span>PKR {i.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && activeTab === "menu" && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
          <div className="max-w-xl mx-auto">
            <button
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

      {/* Cart Modal / Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-100 text-sm">Draft Cart (Table {selectedTableNumber})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
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
                        onClick={() => updateCartQuantity(item.cartKey, -1)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
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
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  <span>Customer Details (Name & Phone Number)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ali Khan"
                      value={customerIdentity.name}
                      onChange={e => setCustomerIdentity(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Phone Number *</label>
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

            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span className="text-slate-300">Total Payable:</span>
                <span className="text-rose-400 text-lg">PKR {cartTotal}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl shadow-lg transition text-sm"
              >
                Send Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {selectedItemForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Select Size/Portion for {selectedItemForVariant.name}</h3>
            <div className="space-y-2">
              {selectedItemForVariant.variants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVariant(v)}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold flex justify-between items-center transition ${
                    selectedVariant?.name === v.name
                      ? 'bg-rose-950/80 border-rose-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="text-amber-400 font-extrabold">PKR {v.price}</span>
                </button>
              ))}
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setSelectedItemForVariant(null)}
                className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddToCart(selectedItemForVariant, selectedVariant)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Submit Complaint (Table {selectedTableNumber})</span>
              </h3>
              <button onClick={() => setIsComplaintModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
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
                onClick={() => setIsComplaintModalOpen(false)}
                className="flex-1 py-2 text-xs text-slate-400 bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleComplaintSubmit}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl shadow"
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
