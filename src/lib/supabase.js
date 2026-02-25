import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://urrdbdrnjhzquklrwfkd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycmRiZHJuamh6cXVrbHJ3ZmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTE1NDYsImV4cCI6MjA4Njg4NzU0Nn0.ijMY0OF5gQlQkQhBBI7zgbjKT0or0cINF6LLFgN0124";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
