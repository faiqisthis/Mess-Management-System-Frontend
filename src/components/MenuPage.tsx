import React, { useEffect, useState } from 'react';
import { Coffee, Soup, Moon } from 'lucide-react';
import { menuService, Meal } from '../services/menuService';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface MealSlot {
  time: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const mealTimes = {
  breakfast: '7:00 AM - 9:00 AM',
  lunch: '12:30 PM - 2:00 PM',
  dinner: '8:00 PM - 9:30 PM',
};

const mealIcons = {
  0: Coffee,  // Breakfast
  1: Soup,    // Lunch
  2: Moon,    // Dinner
};

const mealNames = {
  0: 'Breakfast',
  1: 'Lunch',
  2: 'Dinner',
};

export function MenuPage() {
  const [menu, setMenu] = useState<MealSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchTodayMenu();
  }, []);

  const fetchTodayMenu = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dateStr = new Date().toISOString().split('T')[0];
      const menuData = await menuService.getMenuByDate(dateStr);

      // Group meals by type
      const mealsByType: { [key: number]: Meal[] } = {
        0: [],
        1: [],
        2: [],
      };

      menuData.meals.forEach((meal) => {
        if (mealsByType[meal.type]) {
          mealsByType[meal.type].push(meal);
        }
      });

      // Convert to MealSlot format
      const slots: MealSlot[] = Object.entries(mealsByType)
        .filter(([_, meals]) => meals.length > 0)
        .map(([type, meals]) => {
          const mealType = parseInt(type) as 0 | 1 | 2;
          return {
            time: mealTimes[mealType === 0 ? 'breakfast' : mealType === 1 ? 'lunch' : 'dinner'],
            type: mealNames[mealType],
            icon: mealIcons[mealType],
            items: meals.map((meal, idx) => ({
              id: `${mealType}-${idx}`,
              name: meal.name,
              description: '',
              price: meal.price,
            })),
          };
        });

      setMenu(slots);
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setError(err.message || 'Failed to load menu. Using sample data.');
      // Fallback to sample data
      setMenu(getSampleMenu());
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleMenu = (): MealSlot[] => {
    return [
      {
        time: '7:00 AM - 9:00 AM',
        type: 'Breakfast',
        icon: Coffee,
        items: [
          { id: '1', name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', price: 80 },
          { id: '2', name: 'Poha', description: 'Flattened rice with peanuts and spices', price: 60 },
          { id: '3', name: 'Bread & Butter', description: 'Toasted bread with butter and jam', price: 50 },
          { id: '4', name: 'Tea/Coffee', description: 'Hot beverages', price: 30 },
        ],
      },
      {
        time: '12:30 PM - 2:00 PM',
        type: 'Lunch',
        icon: Soup,
        items: [
          { id: '5', name: 'Rice', description: 'Steamed basmati rice', price: 40 },
          { id: '6', name: 'Dal Tadka', description: 'Yellow lentils tempered with spices', price: 70 },
          { id: '7', name: 'Paneer Butter Masala', description: 'Cottage cheese in creamy tomato gravy', price: 150 },
          { id: '8', name: 'Mixed Vegetable', description: 'Seasonal vegetables curry', price: 90 },
          { id: '9', name: 'Roti', description: 'Whole wheat flatbread', price: 15 },
          { id: '10', name: 'Salad & Raita', description: 'Fresh salad and yogurt', price: 40 },
        ],
      },
      {
        time: '8:00 PM - 9:30 PM',
        type: 'Dinner',
        icon: Moon,
        items: [
          { id: '13', name: 'Rice', description: 'Steamed basmati rice', price: 40 },
          { id: '14', name: 'Dal Makhani', description: 'Black lentils in creamy gravy', price: 100 },
          { id: '15', name: 'Chicken Curry', description: 'Tender chicken in spiced gravy', price: 180 },
          { id: '16', name: 'Aloo Gobi', description: 'Potato and cauliflower dry curry', price: 85 },
          { id: '17', name: 'Chapati', description: 'Whole wheat flatbread', price: 15 },
          { id: '18', name: 'Dessert', description: 'Gulab Jamun', price: 50 },
        ],
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Today&apos;s Menu
        </h1>
        <p className="text-gray-600">{today}</p>
        {error && (
          <div className="mt-2 text-sm text-amber-600">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {menu.map((meal) => {
          const Icon = meal.icon;
          const totalPrice = meal.items.reduce((sum, item) => sum + item.price, 0);
          return (
            <div
              key={meal.type}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl text-white">{meal.type}</h2>
                    <p className="text-sm text-blue-100">{meal.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Total Price</p>
                  <p className="text-xl font-semibold text-white">PKR {totalPrice}</p>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-3">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
