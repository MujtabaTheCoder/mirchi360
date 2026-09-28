import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_DATA } from '../lib/initialData';

const fetchMenuItems = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.warn("Failed to fetch menu items from Supabase, falling back to seed data:", error);
      return SEED_DATA.menuItems;
    }
    
    if (data && data.length > 0) {
      return data;
    }
  }
  
  // Fallback to seed data or localStorage if no supabase config
  const saved = localStorage.getItem('mirchi_menu_items');
  return saved ? JSON.parse(saved) : SEED_DATA.menuItems;
};

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};
