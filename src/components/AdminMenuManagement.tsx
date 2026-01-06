import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { menuService, DailyMenu, Meal } from '../services/menuService';

export function AdminMenuManagement() {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dailyFixedCharge: 20,
    meals: [] as Meal[],
  });

  const [mealForm, setMealForm] = useState<Meal>({
    name: '',
    type: 0,
    price: 0,
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load menus for current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthMenus = await menuService.getMenusInRange(startDate, endDate);
      setMenus(monthMenus);
    } catch (err: any) {
      console.error('Error loading menus:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeal = () => {
    if (!mealForm.name || mealForm.price <= 0) {
      alert('Please fill meal name and price');
      return;
    }

    setFormData({
      ...formData,
      meals: [...formData.meals, { ...mealForm }],
    });

    setMealForm({ name: '', type: 0, price: 0 });
  };

  const handleRemoveMeal = (index: number) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  const handleSaveMenu = async () => {
    if (!formData.date || formData.meals.length === 0) {
      alert('Please select a date and add at least one meal');
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingId) {
        await menuService.updateMenu(editingId, {
          meals: formData.meals,
          dailyFixedCharge: formData.dailyFixedCharge,
        });
        alert('Menu updated successfully!');
      } else {
        await menuService.createMenu({
          date: formData.date,
          meals: formData.meals,
          dailyFixedCharge: formData.dailyFixedCharge,
        });
        alert('Menu created successfully!');
      }

      resetForm();
      await loadMenus();
    } catch (err: any) {
      console.error('Error saving menu:', err);
      alert('Failed to save menu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMenu = (menu: DailyMenu) => {
    setEditingId(menu.id);
    setFormData({
      date: menu.date.split('T')[0],
      dailyFixedCharge: menu.dailyFixedCharge,
      meals: [...menu.meals],
    });
    setIsAddingMenu(true);
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      await menuService.deleteMenu(id);
      alert('Menu deleted successfully!');
      await loadMenus();
    } catch (err: any) {
      console.error('Error deleting menu:', err);
      alert('Failed to delete menu: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      dailyFixedCharge: 20,
      meals: [],
    });
    setMealForm({ name: '', type: 0, price: 0 });
    setIsAddingMenu(false);
    setEditingId(null);
  };

  const getMealTypeName = (type: number) => {
    switch (type) {
      case 0: return 'Breakfast';
      case 1: return 'Lunch';
      case 2: return 'Dinner';
      default: return 'Unknown';
    }
  };

  const getMealTypeColor = (type: number) => {
    switch (type) {
      case 0: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 1: return 'bg-green-100 text-green-700 border-green-200';
      case 2: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
            Menu Management
          </h1>
          <p className="text-gray-600">Manage daily menus and meal items</p>
        </div>
        <button
          onClick={() => setIsAddingMenu(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Menu
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingMenu || editingId) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg mb-4">{editingId ? 'Edit Menu' : 'Create Daily Menu'}</h3>
          
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isSaving || !!editingId}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Daily Fixed Charge (PKR) *</label>
              <input
                type="number"
                value={formData.dailyFixedCharge}
                onChange={(e) => setFormData({ ...formData, dailyFixedCharge: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="0"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Add Meal Section */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h4 className="text-md mb-3 text-gray-700">Add Meals</h4>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Meal Name</label>
                <input
                  type="text"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Paratha, Eggs"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Meal Type</label>
                <select
                  value={mealForm.type}
                  onChange={(e) => setMealForm({ ...mealForm, type: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={isSaving}
                >
                  <option value={0}>Breakfast</option>
                  <option value={1}>Lunch</option>
                  <option value={2}>Dinner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Price (PKR)</label>
                <input
                  type="number"
                  value={mealForm.price || ''}
                  onChange={(e) => setMealForm({ ...mealForm, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., 50"
                  min="0"
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddMeal}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Add Meal
                </button>
              </div>
            </div>
          </div>

          {/* Meals List */}
          {formData.meals.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md mb-3 text-gray-700">Meals ({formData.meals.length})</h4>
              <div className="space-y-2">
                {formData.meals.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`px-2 py-1 rounded text-xs border ${getMealTypeColor(meal.type)}`}>
                        {getMealTypeName(meal.type)}
                      </span>
                      <span className="text-gray-900">{meal.name}</span>
                      <span className="text-sm text-blue-600 font-semibold ml-auto">PKR {meal.price}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal(index)}
                      disabled={isSaving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSaveMenu}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingId ? 'Update Menu' : 'Save Menu'}
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

      {/* Menus List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading menus...</div>
        </div>
      ) : menus.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No menus created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl text-white">
                      {new Date(menu.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                    <p className="text-sm text-blue-100">Fixed Charge: PKR {menu.dailyFixedCharge}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Group meals by type */}
                  {[0, 1, 2].map((type) => {
                    const typeMeals = menu.meals.filter(m => m.type === type);
                    if (typeMeals.length === 0) return null;
                    
                    return (
                      <div key={type} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg mb-3 text-gray-900">{getMealTypeName(type)}</h3>
                        <div className="space-y-2">
                          {typeMeals.map((meal, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-700">{meal.name}</span>
                              <span className="text-sm text-blue-600 font-semibold">PKR {meal.price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold text-gray-900">
                              PKR {typeMeals.reduce((sum, m) => sum + m.price, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xl text-gray-700">Total Food Cost</span>
                  <span className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    PKR {menu.meals.reduce((sum, m) => sum + m.price, 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
