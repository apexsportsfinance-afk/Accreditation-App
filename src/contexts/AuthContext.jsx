import React, { createContext, useContext, useState, useEffect } from "react";
import { UsersAPI } from "../lib/storage";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch role from user_roles table
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (error || !data) return "event_admin";
      return data.role;
    } catch {
      return "event_admin";
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // ✅ Get role from user_roles table
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          role
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // ✅ Get role from user_roles table
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          role
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const authenticatedUser = await UsersAPI.authenticate(email, password);
    if (authenticatedUser) {
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = async () => {
    await UsersAPI.logout();
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const permissions = {
      super_admin: ["all"],
      event_admin: ["view_events", "manage_accreditations", "view_reports"],
      viewer: ["view_events", "view_accreditations"]
    };
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes("all") || userPermissions.includes(permission);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "super_admin",
    isEventAdmin: user?.role === "event_admin",
    isViewer: user?.role === "viewer"
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
