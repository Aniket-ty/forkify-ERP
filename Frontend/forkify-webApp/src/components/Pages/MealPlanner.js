// components/MealPlanner.js
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  Download,
  Printer,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  DollarSign,
  Heart,
  Flame,
  Apple,
  Carrot,
  Fish,
  Egg
} from 'lucide-react';

const MealPlanner = () => {
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [selectedDay, setSelectedDay] = useState('monday');

  // Sample meal plan data
  const mealPlans = {
    current: {
      weekNumber: 15,
      startDate: 'Apr 8, 2024',
      endDate: 'Apr 14, 2024',
      totalCalories: 14500,
      totalCost: 245.50,
      days: {
        monday: {
          meals: [
            { type: 'breakfast', name: 'Avocado Toast', calories: 350, prepTime: 15, cost: 2.50 },
            { type: 'lunch', name: 'Chicken Salad', calories: 420, prepTime: 20, cost: 4.25 },
            { type: 'dinner', name: 'Grilled Salmon', calories: 480, prepTime: 30, cost: 6.75 },
            { type: 'snack', name: 'Greek Yogurt', calories: 150, prepTime: 5, cost: 1.20 }
          ],
          totalCalories: 1400,
          totalCost: 14.70
        },
        tuesday: {
          meals: [
            { type: 'breakfast', name: 'Smoothie Bowl', calories: 320, prepTime: 10, cost: 3.20 },
            { type: 'lunch', name: 'Quinoa Bowl', calories: 380, prepTime: 25, cost: 3.80 },
            { type: 'dinner', name: 'Vegetable Stir Fry', calories: 420, prepTime: 35, cost: 4.50 },
            { type: 'snack', name: 'Apple with PB', calories: 180, prepTime: 5, cost: 1.00 }
          ],
          totalCalories: 1300,
          totalCost: 12.50
        }
      }
    }
  };

  const dietaryStats = [
    { label: 'Protein', value: '45%', target: '50%', color: 'green' },
    { label: 'Carbs', value: '35%', target: '30%', color: 'orange' },
    { label: 'Fat', value: '20%', target: '20%', color: 'red' },
    { label: 'Fiber', value: '28g', target: '30g', color: 'purple' }
  ];

  const shoppingList = [
    { item: 'Chicken Breast', quantity: '2 kg', category: 'Meat', checked: true },
    { item: 'Salmon Fillet', quantity: '1.5 kg', category: 'Seafood', checked: true },
    { item: 'Avocado', quantity: '8 pieces', category: 'Produce', checked: false },
    { item: 'Spinach', quantity: '500g', category: 'Produce', checked: false },
    { item: 'Greek Yogurt', quantity: '2 kg', category: 'Dairy', checked: true },
    { item: 'Quinoa', quantity: '1 kg', category: 'Grains', checked: false }
  ];

  return (
    <div className="meal-planner-container">
      <div className="meal-planner-header">
        <div className="header-left">
          <h1><Calendar size={24} /> Meal Planning</h1>
          <p>Plan your meals, track nutrition, and generate shopping lists</p>
        </div>
        <div className="header-right">
          <div className="action-buttons">
            <button className="btn-outline">
              <Download size={18} />
              <span>Export</span>
            </button>
            <button className="btn-outline">
              <Printer size={18} />
              <span>Print</span>
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              <span>New Plan</span>
            </button>
          </div>
        </div>
      </div>

      <div className="meal-planner-content">
        {/* Week Selection */}
        <div className="week-selection">
          <div className="week-cards">
            <div className={`week-card ${selectedWeek === 'previous' ? 'active' : ''}`}>
              <div className="week-label">Week 14</div>
              <div className="week-dates">Apr 1-7</div>
              <div className="week-stats">1,400 avg cal/day</div>
            </div>
            <div className={`week-card ${selectedWeek === 'current' ? 'active' : ''}`}>
              <div className="week-label">Week 15</div>
              <div className="week-dates">Apr 8-14</div>
              <div className="week-stats">1,450 avg cal/day</div>
              <div className="week-badge">Current</div>
            </div>
            <div className={`week-card ${selectedWeek === 'next' ? 'active' : ''}`}>
              <div className="week-label">Week 16</div>
              <div className="week-dates">Apr 15-21</div>
              <div className="week-stats">1,380 avg cal/day</div>
            </div>
          </div>
        </div>

        <div className="planner-grid">
          {/* Left Column - Days Navigation */}
          <div className="planner-sidebar">
            <div className="days-navigation">
              <h3>Days</h3>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <button
                  key={day}
                  className={`day-button ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  <span className="day-calories">1,400 cal</span>
                </button>
              ))}
            </div>

            {/* Nutrition Summary */}
            <div className="nutrition-summary">
              <h3>Nutrition Summary</h3>
              <div className="nutrition-stats">
                <div className="nutrition-stat">
                  <Flame size={20} />
                  <div className="stat-details">
                    <div className="stat-value">1,450</div>
                    <div className="stat-label">Avg Calories/Day</div>
                  </div>
                </div>
                <div className="nutrition-stat">
                  <DollarSign size={20} />
                  <div className="stat-details">
                    <div className="stat-value">$245.50</div>
                    <div className="stat-label">Weekly Cost</div>
                  </div>
                </div>
                <div className="nutrition-stat">
                  <Clock size={20} />
                  <div className="stat-details">
                    <div className="stat-value">85 min</div>
                    <div className="stat-label">Avg Prep Time/Day</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro Targets */}
            <div className="macro-targets">
              <h3>Macro Targets</h3>
              <div className="targets-grid">
                {dietaryStats.map((stat, index) => (
                  <div key={index} className="target-card">
                    <div className="target-label">{stat.label}</div>
                    <div className="target-value">{stat.value}</div>
                    <div className="target-bar">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: stat.label === 'Fiber' ? '93%' : '90%',
                          backgroundColor: `var(--${stat.color})` 
                        }}
                      ></div>
                    </div>
                    <div className="target-goal">Target: {stat.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Day Details */}
          <div className="planner-main">
            {/* Day Header */}
            <div className="day-header">
              <div className="day-title">
                <h2>{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</h2>
                <div className="day-meta">
                  <span className="meta-item">
                    <Flame size={16} />
                    {mealPlans.current.days[selectedDay]?.totalCalories || 1400} calories
                  </span>
                  <span className="meta-item">
                    <DollarSign size={16} />
                    ${mealPlans.current.days[selectedDay]?.totalCost || 14.70} total cost
                  </span>
                  <span className="meta-item">
                    <Clock size={16} />
                    85 min total prep
                  </span>
                </div>
              </div>
              <div className="day-actions">
                <button className="btn-outline">
                  <Edit2 size={16} />
                  <span>Edit Day</span>
                </button>
                <button className="btn-outline">
                  <Plus size={16} />
                  <span>Add Meal</span>
                </button>
              </div>
            </div>

            {/* Meals Grid */}
            <div className="meals-grid">
              {mealPlans.current.days[selectedDay]?.meals.map((meal, index) => (
                <div key={index} className="meal-card">
                  <div className="meal-header">
                    <div className="meal-type">{meal.type}</div>
                    <div className="meal-time">8:00 AM</div>
                  </div>
                  <div className="meal-content">
                    <h3 className="meal-name">{meal.name}</h3>
                    <div className="meal-stats">
                      <div className="meal-stat">
                        <Flame size={14} />
                        <span>{meal.calories} cal</span>
                      </div>
                      <div className="meal-stat">
                        <Clock size={14} />
                        <span>{meal.prepTime} min</span>
                      </div>
                      <div className="meal-stat">
                        <DollarSign size={14} />
                        <span>${meal.cost}</span>
                      </div>
                    </div>
                    <div className="meal-tags">
                      <span className="tag">High Protein</span>
                      <span className="tag">Vegetarian</span>
                    </div>
                  </div>
                  <div className="meal-actions">
                    <button className="btn-icon-xs">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon-xs">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Shopping List */}
            <div className="shopping-list-section">
              <div className="section-header">
                <h3><ShoppingCart size={20} /> Shopping List</h3>
                <div className="list-stats">
                  <span className="stat">6 items</span>
                  <span className="stat">$45.80 total</span>
                </div>
              </div>
              <div className="shopping-list">
                {shoppingList.map((item, index) => (
                  <div key={index} className="shopping-item">
                    <label className="item-checkbox">
                      <input type="checkbox" checked={item.checked} readOnly />
                      <span className="checkmark"></span>
                    </label>
                    <div className="item-details">
                      <div className="item-name">{item.item}</div>
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity}</span>
                        <span className="item-category">{item.category}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button className="btn-icon-xs">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="list-actions">
                <button className="btn-outline">
                  <Download size={16} />
                  <span>Export List</span>
                </button>
                <button className="btn-primary">
                  <ShoppingCart size={16} />
                  <span>Generate Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;