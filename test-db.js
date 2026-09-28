import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:\\Users\\DELL\\Desktop\\mirchi-360\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = {
    restaurant_id: '6b8015e9-95d0-4fd9-ac57-2d8d8cc8c111',
    branch_id: 'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3',
    table_id: 'f896d51a-029e-46f8-8be8-b36ff3bdad16',
    table_number: 4,
    status: 'pending',
    payment: 'Unpaid',
    total_amount: 500,
    notes: 'test',
    customer_name: 'Mujtaba',
    customer_phone: '1234567',
    shift_type: 'Morning',
    shift_id: 'SHIFT-2026-M'
  };

  const { data, error } = await supabase.from('orders').insert(payload).select();
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
