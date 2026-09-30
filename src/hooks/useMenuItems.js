import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_DATA } from '../lib/initialData';

const fetchMenuItems = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*');
      
      if (!error && data && data.length > 0) {
        return data.map(item => ({
          ...item,
          categoryName: item.categoryName || item.category_name,
          image: item.image || item.image_url,
          isOutOfStock: item.isOutOfStock !== undefined ? item.isOutOfStock : (item.is_out_of_stock || false),
          hasVariants: item.hasVariants !== undefined ? item.hasVariants : (item.has_variants || false)
        }));
      }
    } catch (e) {
      console.warn("Supabase menu_items fetch error:", e);
    }
  }
  
  // Fallback to localStorage or seed data
  try {
    const saved = localStorage.getItem('mirchi_menu_items');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SEED_DATA.menuItems;
};

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};
