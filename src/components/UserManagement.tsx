import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, UserPlus } from 'lucide-react';
import { User, UserRole } from '../App';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'student1', name: 'John Doe', role: 'student', email: 'john@example.com' },
    { id: '2', username: 'teacher1', name: 'Sarah Smith', role: 'teacher', email: 'sarah@example.com' },
    { id: '3', username: 'admin1', name: 'Mike Johnson', role: 'admin', email: 'mike@example.com' },
    { id: '101', username: 'alice', name: 'Alice Johnson', role: 'student', email: 'alice@example.com' },
    { id: '102', username: 'bob', name: 'Bob Williams', role: 'student', email: 'bob@example.com' },
    { id: '103', username: 'emma', name: 'Emma Davis', role: 'student', email: 'emma@example.com' },
  ]);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'student' as UserRole,
  });

  const handleAddUser = () => {
    if (formData.username && formData.name && formData.email) {
      const newUser: User = {
        id: Date.now().toString(),
        username: formData.username,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      setUsers([...users, newUser]);
      setFormData({ username: '', name: '', email: '', role: 'student' });
      setIsAddingUser(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleUpdateUser = () => {
    if (editingId && formData.username && formData.name && formData.email) {
      setUsers(
        users.map((user) =>
          user.id === editingId
            ? { ...user, username: formData.username, name: formData.name, email: formData.email, role: formData.role }
            : user
        )
      );
      setEditingId(null);
      setFormData({ username: '', name: '', email: '', role: 'student' });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setIsAddingUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
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
              <label className="block text-sm mb-2 text-gray-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., johndoe"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingId ? handleUpdateUser : handleAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsAddingUser(false);
                setEditingId(null);
                setFormData({ username: '', name: '', email: '', role: 'student' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Username</th>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Email</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Role</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        {user.name.charAt(0)}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">@{user.username}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
