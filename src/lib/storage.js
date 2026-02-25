export const UsersAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("UsersAPI.getAll error:", error);
      return [];
    }
    return data.map(u => ({
      id: u.id,
      email: u.email,
      name: u.full_name || u.email,
      role: u.role || "viewer",
      avatar: u.avatar_url,
      createdAt: u.created_at
    }));
  },

  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    return {
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.email,
      role: profile?.role || "viewer"
    };
  },

  authenticate: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    return {
      id: data.user.id,
      email: data.user.email,
      name: profile?.full_name || email,
      role: profile?.role || "viewer"
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  create: async (userData) => {
    // Create auth user via Supabase Admin
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { name: userData.name }
    });
    if (error) throw error;

    // Upsert profile with role
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: userData.email,
        full_name: userData.name,
        role: userData.role
      });
    if (profileError) throw profileError;

    AuditAPI.log("user_created", { userId: data.user.id, email: userData.email, role: userData.role });
    return { id: data.user.id, ...userData };
  },

  update: async (id, updates) => {
    // Update profile table
    const profileUpdates = {};
    if (updates.name) profileUpdates.full_name = updates.name;
    if (updates.email) profileUpdates.email = updates.email;
    if (updates.role) profileUpdates.role = updates.role;

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", id);
    if (profileError) throw profileError;

    // Update password if provided
    if (updates.password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(id, {
        password: updates.password
      });
      if (pwError) throw pwError;
    }

    AuditAPI.log("user_updated", { userId: id, fields: Object.keys(updates) });
    return { id, ...updates };
  },

  delete: async (id) => {
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    // Delete profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);
    if (profileError) throw profileError;

    AuditAPI.log("user_deleted", { userId: id });
    return true;
  }
};
