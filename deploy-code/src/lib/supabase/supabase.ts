import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv"
dotenv.config();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABSE_KEY

  export const supabase = createClient(supabaseUrl as string, supabaseKey as string);

