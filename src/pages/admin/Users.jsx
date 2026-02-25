import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Plus, Users as UsersIcon, Shield,
  Calendar, Eye, Edit, Trash2, UserCheck, Loader2
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { UsersAPI } from "../../lib/storage";
import { formatDate } from "../../lib/utils";

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "event_admin", label: "Event Admin" },
  { value: "viewer", label: "Viewer" }
];

const ROLE_CONFIG = {
  super_admin: {
    label: "Super Admin",
    icon: Shield,
    iconColor: "text-red-400",
    badge: "danger",
    access: ["Dashboard", "Events", "Accreditations", "Users", "Settings", "Audit Log"]
  },
  event_admin: {
    label: "Event Admin",
    icon: Calendar,
    iconColor: "text-cyan-400",
    badge: "primary",
    access: ["Dashboard", "Events", "Accreditations"]
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    iconColor: "text-slate-400",
    badge: "default",
    access: ["Dashboard", "Events (read only)", "Accreditations (read only)"]
  }
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "event_admin"
  });
  const [formErrors, setFormErrors] = useState({});
  const { user: currentUser, isSuperAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await UsersAPI.getAll();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "event_admin" });
    setFormErrors({});setEditingUser(null);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email";
    if (!editingUser && !formData.password) errors.password = "Password is required";
    if (formData.password && formData.password.length < 6) errors.password = "Min 6 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingUser) {
        const updates = { name: formData.name, email: formData.email, role: formData.role };
        if (formData.password) updates.password = formData.password;
        await UsersAPI.update(editingUser.id, updates);
        toast.success("User updated successfully");} else {
        await UsersAPI.create(formData);
        toast.success(`User created! ${formData.name} can now log in.`);
      }
      handleCloseModal();
      loadUsers();
    } catch (err) {
      console.error("Save user error:", err);
      toast.error(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;
    setDeleting(deleteModal.user.id);
    try {
      await UsersAPI.delete(deleteModal.user.id);
      toast.success("User deleted successfully");
      setDeleteModal({ open: false, user: null });
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => {
        const config = ROLE_CONFIG[row.role] || ROLE_CONFIG.viewer;
        const initials = row.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{row.name}</p>
              <p className="text-xs text-slate-400">{row.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => {
        const config = ROLE_CONFIG[row.role] || ROLE_CONFIG.viewer;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
            <Badge variant={config.badge}>{config.label}</Badge>
          </div>
        );
      }
    },
    {
      key: "access",
      header: "Access",
      render: (row) => {
        const config = ROLE_CONFIG[row.role] || ROLE_CONFIG.viewer;
        return (
          <div className="flex flex-wrap gap-1">
            {config.access.slice(0, 3).map((item) => (
              <span key={item} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600/40">
                {item}
              </span>
            ))}{config.access.length > 3 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">
                +{config.access.length - 3} more
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-400">{formatDate(row.createdAt)}</span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }}
            className="p-1.5 rounded-lg hover:bg-cyan-500/20 transition-colors"title="Edit user"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          {row.id !== currentUser?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, user: row }); }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete user"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (!isSuperAdmin) {
    return (
      <EmptyState
        icon={Shield}
        title="Access Denied"
        description="Only Super Admins can manage users"
      />
    );
  }

  return (
    <div id="users_page" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-sm text-slate-400">
            Manage system users and their access permissions
          </p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()} size="sm">
          Add User
        </Button>
      </div>

      {/* Role Access Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = users.filter(u => u.role === key).length;
          return (
            <div key={key} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{config.label}</p>
                <p className="text-xs text-slate-400">{config.access.length} permissions</p>
              </div>
              <span className="text-2xl font-bold text-white">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No Users Yet"
          description="Add users to give them access to the system"
          action={() => handleOpenModal()}
          actionLabel="Add First User"
          actionIcon={Plus}
        />
      ) : (
        <DataTable
          data={users}
          columns={columns}
          searchable
          searchFields={["name", "email", "role"]}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {/* Role access preview */}
          {formData.role && (
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-400 mb-2">Access permissions for this role:</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_CONFIG[formData.role]?.access.map((item) => (
                  <span key={item} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="John Doe"
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com"
            error={formErrors.email}
            required
          />

          <Input
            label={editingUser ? "New Password (leave blank to keep)" : "Password"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
            placeholder={editingUser ? "Leave blank to keep current" : "Min 6 characters"}
            error={formErrors.password}
            required={!editingUser}
          />

          <Select
            label="Role & Access Level"
            value={formData.role}
            onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
            options={ROLES}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving} disabled={saving}>
              {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Delete User"
      >
        <div className="p-5 space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-300">
              Are you sure you want to delete{" "}
              <span className="font-bold text-white">{deleteModal.user?.name}</span>?
              They will immediately lose all access to the system.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, user: null })}
              className="flex-1"
              disabled={!!deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleDeleteConfirm}
              className="flex-1"
              loading={!!deleting}
              disabled={!!deleting}
            >
              {deleting ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
