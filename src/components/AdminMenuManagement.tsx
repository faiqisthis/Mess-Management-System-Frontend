import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  price: number;
}

export function AdminMenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', mealType: 'breakfast', price: 80 },
    { id: '2', name: 'Poha', description: 'Flattened rice with peanuts', mealType: 'breakfast', price: 60 },
    { id: '3', name: 'Rice', description: 'Steamed basmati rice', mealType: 'lunch', price: 40 },
    { id: '4', name: 'Dal Tadka', description: 'Yellow lentils tempered with spices', mealType: 'lunch', price: 70 },
    { id: '6', name: 'Dal Makhani', description: 'Black lentils in creamy gravy', mealType: 'dinner', price: 100 },
  ]);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mealType: 'breakfast' as MenuItem['mealType'],
    price: 0,
  });

  const handleAddItem = () => {
    if (formData.name && formData.description && formData.price > 0) {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        mealType: formData.mealType,
        price: formData.price,
      };
      setMenuItems([...menuItems, newItem]);
      setFormData({ name: '', description: '', mealType: 'breakfast', price: 0 });
      setIsAddingItem(false);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      mealType: item.mealType,
      price: item.price,
    });
  };

  const handleUpdateItem = () => {
    if (editingId && formData.name && formData.description && formData.price > 0) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingId
            ? { ...item, name: formData.name, description: formData.description, mealType: formData.mealType, price: formData.price }
            : item
        )
      );
      setEditingId(null);
      setFormData({ name: '', description: '', mealType: 'breakfast', price: 0 });
    }
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter((item) => item.id !== id));
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', color: 'from-orange-500 to-yellow-500' },
    { value: 'lunch', label: 'Lunch', color: 'from-green-500 to-emerald-500' },
    { value: 'dinner', label: 'Dinner', color: 'from-blue-500 to-indigo-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Menu Management
          </h1>
          <p className="text-gray-600">Add, edit, or remove menu items</p>
        </div>
        <button
          onClick={() => setIsAddingItem(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingItem || editingId) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg mb-4">{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Paneer Butter Masala"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MenuItem['mealType'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {mealTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Price (PKR)</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., 150"
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-2 text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Brief description of the item"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingId ? handleUpdateItem : handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsAddingItem(false);
                setEditingId(null);
                setFormData({ name: '', description: '', mealType: 'breakfast', price: 0 });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mealTypes.map((mealType) => {
          const items = menuItems.filter((item) => item.mealType === mealType.value);
          return (
            <div key={mealType.value} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${mealType.color} px-6 py-4`}>
                <h2 className="text-xl text-white">{mealType.label}</h2>
              </div>
              <div className="p-6">
                {items.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No items added yet</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-gray-900">{item.name}</h3>
                              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">PKR {item.price}</span>
                            </div>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
