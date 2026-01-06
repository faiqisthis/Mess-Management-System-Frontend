import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, UserPlus } from 'lucide-react';
import { userService, User as BackendUser } from '../services/userService';

export function UserManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 0,
    rollNumber: '',
    roomNumber: '',
    contactNumber: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Please fill all required fields (including password)');
      return;
    }

    try {
      setIsSaving(true);
      await userService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        rollNumber: formData.rollNumber || undefined,
        roomNumber: formData.roomNumber || undefined,
        contactNumber: formData.contactNumber || undefined,
      });
      resetForm();
      await loadUsers();
      alert('User created successfully!');
    } catch (err: any) {
      console.error('Error creating user:', err);
      alert('Failed to create user: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = (user: BackendUser) => {
    setEditingId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role,
      rollNumber: user.rollNumber || '',
      roomNumber: user.roomNumber || '',
      contactNumber: user.contactNumber || '',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingId || !formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setIsSaving(true);
      await userService.updateUser(editingId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        rollNumber: formData.rollNumber || undefined,
        roomNumber: formData.roomNumber || undefined,
        contactNumber: formData.contactNumber || undefined,
      });
      resetForm();
      await loadUsers();
      alert('User updated successfully!');
    } catch (err: any) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(id);
      await loadUsers();
      alert('User deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 0,
      rollNumber: '',
      roomNumber: '',
      contactNumber: '',
    });
    setIsAddingUser(false);
    setEditingId(null);
  };

  const getRoleBadgeColor = (role: number) => {
    switch (role) {
      case 2: // Admin
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 1: // Teacher
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 0: // Student
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 2: return 'Admin';
      case 1: return 'Teacher';
      case 0: default: return 'Student';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setIsAddingUser(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingUser || editingId) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg mb-4">{editingId ? 'Edit User' : 'Add New User'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-2 text-gray-700">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., John"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Doe"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., john@example.com"
                disabled={isSaving}
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm mb-2 text-gray-700">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter password"
                  disabled={isSaving}
                />
              </div>
            )}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isSaving}
              >
                <option value={0}>Student</option>
                <option value={1}>Teacher</option>
                <option value={2}>Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Roll Number</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., CS2024001"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Room Number</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., A-101"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Contact Number</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., +1234567890"
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingId ? handleUpdateUser : handleAddUser}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={resetForm}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading users...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-700">Roll Number</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-700">Role</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <span>{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.rollNumber || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs border ${
                        user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
