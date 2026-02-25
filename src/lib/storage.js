getCurrentUser: async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  // ✅ Read from user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name || session.user.email,
    role: roleData?.role || "event_admin"
  };
},

authenticate: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return null;

  // ✅ Read from user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || email,
    role: roleData?.role || "event_admin"
  };
},
