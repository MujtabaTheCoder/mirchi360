import { STAFF_ACCOUNTS } from './staffCredentials';

export const SEED_DATA = {
  restaurant: {
    id: "rest-mirchi360",
    name: "Mirchi360",
    slug: "mirchi360",
    currency: "PKR"
  },
  branches: [
    { id: "branch-def", name: "Defence", address: "Defence Commercial Area" },
    { id: "branch-qas", name: "Qasimabad", address: "Qasimabad Main Boulevard" }
  ],
  staff: STAFF_ACCOUNTS,
  categories: [
    { id: "cat-new", name: "New Arrivals" },
    { id: "cat-chinese", name: "Mirchi Chinese" },
    { id: "cat-steaks", name: "Mirchi Steaks, Pasta & Lasagna" },
    { id: "cat-fish", name: "Fish Mirchi" },
    { id: "cat-parathas", name: "Mirchi Parathas" },
    { id: "cat-juices", name: "Mirchi Fresh Juices" },
    { id: "cat-breads", name: "Naan & Breads" },
    { id: "cat-salads", name: "Mirchi Salads" },
    { id: "cat-desserts", name: "Mirchi Desserts" },
    { id: "cat-rolls", name: "Mirchi Roll" },
    { id: "cat-fastfood", name: "Mirchi Fast Food" },
    { id: "cat-pizza", name: "Mirchi Pizza" },
    { id: "cat-bbq", name: "Mirchi BBQ" },
    { id: "cat-handi", name: "Mirchi Handi" },
    { id: "cat-karahi", name: "Mirchi Karahi" },
    { id: "cat-biryani", name: "Mirchi Biryani" },
    { id: "cat-beverages", name: "Mirchi Beverages" }
  ],
  menuItems: [
    // New Arrivals
    { id: "item-1", categoryId: "cat-new", categoryName: "New Arrivals", name: "Beef Smash Burger", price: 590, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-2", categoryId: "cat-new", categoryName: "New Arrivals", name: "Beef Smash Burger Double", price: 840, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-3", categoryId: "cat-new", categoryName: "New Arrivals", name: "Beef Seekh Kabab", price: 930, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-4", categoryId: "cat-new", categoryName: "New Arrivals", name: "Beef Gola Kabab", price: 930, image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-5", categoryId: "cat-new", categoryName: "New Arrivals", name: "Beef Behari Boti", price: 930, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Mirchi Chinese
    { id: "item-6", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Corn Soup", price: 200, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-7", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Hot & Sour", price: 220, image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-8", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Chicken Chili With Rice", price: 750, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-9", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Ch Shashlik With Rice", price: 790, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-10", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Chicken Mirchi 360 Special With Rice", price: 880, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-11", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Chicken Dry Chili With Rice", price: 750, image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-12", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Asian Thali", price: 1100, image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-13", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Chinese Thali", price: 1100, image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-14", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Singaporean Rice", price: 1150, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-15", categoryId: "cat-chinese", categoryName: "Mirchi Chinese", name: "Chicken Chow Mein", price: 630, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Steaks, Pasta & Lasagna
    { id: "item-16", categoryId: "cat-steaks", categoryName: "Mirchi Steaks, Pasta & Lasagna", name: "California Steak", price: 1750, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-17", categoryId: "cat-steaks", categoryName: "Mirchi Steaks, Pasta & Lasagna", name: "Italian Steak", price: 1750, image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-18", categoryId: "cat-steaks", categoryName: "Mirchi Steaks, Pasta & Lasagna", name: "Lasagna", price: 1750, image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-19", categoryId: "cat-steaks", categoryName: "Mirchi Steaks, Pasta & Lasagna", name: "Alfredo Pasta", price: 1450, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-20", categoryId: "cat-steaks", categoryName: "Mirchi Steaks, Pasta & Lasagna", name: "Penne Pasta", price: 1450, image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281293?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Fish Mirchi
    { id: "item-21", categoryId: "cat-fish", categoryName: "Fish Mirchi", name: "Finger Fish", price: 1050, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-22", categoryId: "cat-fish", categoryName: "Fish Mirchi", name: "Fish N Chips", price: 1050, image: "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Mirchi Parathas
    { id: "item-23", categoryId: "cat-parathas", categoryName: "Mirchi Parathas", name: "Aalu Paratha", price: 220, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-24", categoryId: "cat-parathas", categoryName: "Mirchi Parathas", name: "Plain Paratha", price: 60, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-25", categoryId: "cat-parathas", categoryName: "Mirchi Parathas", name: "Chutney Paratha", price: 60, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-26", categoryId: "cat-parathas", categoryName: "Mirchi Parathas", name: "Chicken Paratha", price: 350, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-27", categoryId: "cat-parathas", categoryName: "Mirchi Parathas", name: "Chicken Cheese Paratha", price: 370, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Fresh Juices & Shakes
    { id: "item-28", categoryId: "cat-juices", categoryName: "Mirchi Fresh Juices", name: "Kit Kat Shake", price: 470, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-29", categoryId: "cat-juices", categoryName: "Mirchi Fresh Juices", name: "Strawberry Shake", price: 470, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-30", categoryId: "cat-juices", categoryName: "Mirchi Fresh Juices", name: "Mango Juice", price: 290, image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Mirchi Rolls (with variant add-on options)
    { 
      id: "item-roll-1", 
      categoryId: "cat-rolls", 
      categoryName: "Mirchi Roll", 
      name: "Chicken Roll", 
      price: 280, 
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variants: [
        { name: "Standard Chutney", price: 280 },
        { name: "Garlic Mayo", price: 300 },
        { name: "Cheese Special", price: 320 }
      ]
    },
    { 
      id: "item-roll-2", 
      categoryId: "cat-rolls", 
      categoryName: "Mirchi Roll", 
      name: "Chicken Bihari Boti Roll", 
      price: 280, 
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variants: [
        { name: "Standard Chutney", price: 280 },
        { name: "Garlic Mayo", price: 300 },
        { name: "Cheese Special", price: 320 }
      ]
    },

    // Fast Food
    { id: "item-ff-1", categoryId: "cat-fastfood", categoryName: "Mirchi Fast Food", name: "Zinger Burger", price: 530, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-ff-2", categoryId: "cat-fastfood", categoryName: "Mirchi Fast Food", name: "Jumbo Fries", price: 250, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-ff-3", categoryId: "cat-fastfood", categoryName: "Mirchi Fast Food", name: "Chicken Broast", price: 690, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-ff-4", categoryId: "cat-fastfood", categoryName: "Mirchi Fast Food", name: "Chicken Club Sandwich", price: 470, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Mirchi Pizza (Size Variants: Small, Medium, Large)
    {
      id: "item-pz-1",
      categoryId: "cat-pizza",
      categoryName: "Mirchi Pizza",
      name: "Chicken Fajita",
      price: 400,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "size",
      variants: [
        { name: "Small", price: 400 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1550 }
      ]
    },
    {
      id: "item-pz-2",
      categoryId: "cat-pizza",
      categoryName: "Mirchi Pizza",
      name: "Chicken Tikka Pizza",
      price: 400,
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "size",
      variants: [
        { name: "Small", price: 400 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1550 }
      ]
    },
    {
      id: "item-pz-3",
      categoryId: "cat-pizza",
      categoryName: "Mirchi Pizza",
      name: "Chicken Super Supreme",
      price: 400,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "size",
      variants: [
        { name: "Small", price: 400 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1550 }
      ]
    },

    // BBQ
    { id: "item-bbq-1", categoryId: "cat-bbq", categoryName: "Mirchi BBQ", name: "Chicken Tikka", price: 430, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-bbq-2", categoryId: "cat-bbq", categoryName: "Mirchi BBQ", name: "Chicken Malai Boti", price: 760, image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-bbq-3", categoryId: "cat-bbq", categoryName: "Mirchi BBQ", name: "BBQ Platter", price: 4200, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },

    // Mirchi Handi (Portion Variants: Half, Full)
    {
      id: "item-handi-1",
      categoryId: "cat-handi",
      categoryName: "Mirchi Handi",
      name: "Chicken Makhni Handi",
      price: 1450,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 1450 },
        { name: "Full", price: 2650 }
      ]
    },
    {
      id: "item-handi-2",
      categoryId: "cat-handi",
      categoryName: "Mirchi Handi",
      name: "Mutton Handi",
      price: 2200,
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 2200 },
        { name: "Full", price: 3950 }
      ]
    },

    // Mirchi Karahi (Portion Variants: Half, Full)
    {
      id: "item-karahi-1",
      categoryId: "cat-karahi",
      categoryName: "Mirchi Karahi",
      name: "Chicken Karahi",
      price: 1050,
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 1050 },
        { name: "Full", price: 1990 }
      ]
    },
    {
      id: "item-karahi-2",
      categoryId: "cat-karahi",
      categoryName: "Mirchi Karahi",
      name: "Mutton Karahi",
      price: 2100,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 2100 },
        { name: "Full", price: 3850 }
      ]
    },

    // Mirchi Biryani (Portion Variants: Half, Full)
    {
      id: "item-biryani-1",
      categoryId: "cat-biryani",
      categoryName: "Mirchi Biryani",
      name: "Royal Sindhi Chicken Biryani",
      price: 890,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 890 },
        { name: "Full", price: 1550 }
      ]
    },
    {
      id: "item-biryani-2",
      categoryId: "cat-biryani",
      categoryName: "Mirchi Biryani",
      name: "Mutton Biryani",
      price: 1250,
      image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
      hasVariants: true,
      variantType: "portion",
      variants: [
        { name: "Half", price: 1250 },
        { name: "Full", price: 2500 }
      ]
    },

    // Beverages
    { id: "item-bev-1", categoryId: "cat-beverages", categoryName: "Mirchi Beverages", name: "Cold Drink (Can/Bottle)", price: 140, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-bev-2", categoryId: "cat-beverages", categoryName: "Mirchi Beverages", name: "1.5 Liter Cold Drink", price: 230, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80", isOutOfStock: false },
    { id: "item-bev-3", categoryId: "cat-beverages", categoryName: "Mirchi Beverages", name: "Falooda", price: 390, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", isOutOfStock: false }
  ]
};
