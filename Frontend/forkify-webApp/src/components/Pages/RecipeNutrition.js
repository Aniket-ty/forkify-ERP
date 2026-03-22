// components/RecipeNutrition.js
import React, { useState } from 'react';
import {
  Calculator,
  ChefHat,
  Scale,
  Thermometer,
  Clock,
  Users,
  Zap,
  Droplets,
  Apple,
  Carrot,
  Fish,
  Egg,
  Wheat,
  Milk,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  Printer,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const RecipeNutrition = () => {
  const [selectedRecipe, setSelectedRecipe] = useState(1);
  const [servings, setServings] = useState(4);

  // Sample Recipes with Nutrition Data
  const recipes = [
    {
      id: 1,
      name: 'Margherita Pizza',
      category: 'Italian',
      prepTime: 45,
      cookTime: 15,
      servings: 4,
      difficulty: 'Medium',
      calories: 285,
      protein: 12,
      carbs: 36,
      fat: 10,
      fiber: 2,
      allergens: ['gluten', 'dairy'],
      dietaryTags: ['vegetarian'],
      costPerServing: 3.50,
      ingredients: [
        { name: 'Pizza Dough', quantity: 500, unit: 'g' },
        { name: 'Tomato Sauce', quantity: 200, unit: 'g' },
        { name: 'Fresh Mozzarella', quantity: 250, unit: 'g' },
        { name: 'Basil Leaves', quantity: 20, unit: 'g' },
        { name: 'Olive Oil', quantity: 30, unit: 'ml' },
      ],
      nutritionalBreakdown: {
        calories: { total: 1140, perServing: 285 },
        macronutrients: {
          protein: { value: 48, unit: 'g', dv: 96 },
          carbs: { value: 144, unit: 'g', dv: 48 },
          fat: { value: 40, unit: 'g', dv: 62 },
          fiber: { value: 8, unit: 'g', dv: 32 }
        },
        vitamins: [
          { name: 'Vitamin A', value: 15, unit: '% DV' },
          { name: 'Vitamin C', value: 20, unit: '% DV' },
          { name: 'Calcium', value: 25, unit: '% DV' },
          { name: 'Iron', value: 10, unit: '% DV' }
        ]
      }
    },
    {
      id: 2,
      name: 'Grilled Salmon',
      category: 'Seafood',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      difficulty: 'Easy',
      calories: 367,
      protein: 34,
      carbs: 2,
      fat: 25,
      fiber: 1,
      allergens: ['fish'],
      dietaryTags: ['gluten-free', 'high-protein'],
      costPerServing: 8.75,
      ingredients: [
        { name: 'Salmon Fillet', quantity: 400, unit: 'g' },
        { name: 'Lemon', quantity: 1, unit: 'whole' },
        { name: 'Olive Oil', quantity: 15, unit: 'ml' },
        { name: 'Dill', quantity: 10, unit: 'g' },
        { name: 'Garlic', quantity: 2, unit: 'cloves' },
      ],
      nutritionalBreakdown: {
        calories: { total: 734, perServing: 367 },
        macronutrients: {
          protein: { value: 68, unit: 'g', dv: 136 },
          carbs: { value: 4, unit: 'g', dv: 1 },
          fat: { value: 50, unit: 'g', dv: 77 },
          fiber: { value: 2, unit: 'g', dv: 8 }
        },
        vitamins: [
          { name: 'Vitamin D', value: 127, unit: '% DV' },
          { name: 'Vitamin B12', value: 133, unit: '% DV' },
          { name: 'Selenium', value: 85, unit: '% DV' },
          { name: 'Omega-3', value: 2100, unit: 'mg' }
        ]
      }
    }
  ];

  const currentRecipe = recipes.find(r => r.id === selectedRecipe) || recipes[0];

  const nutritionData = [
    { label: 'Calories', value: currentRecipe.calories, unit: 'kcal', color: 'blue', icon: Zap },
    { label: 'Protein', value: currentRecipe.protein, unit: 'g', color: 'green', icon: Activity },
    { label: 'Carbs', value: currentRecipe.carbs, unit: 'g', color: 'orange', icon: Apple },
    { label: 'Fat', value: currentRecipe.fat, unit: 'g', color: 'red', icon: Droplets },
    { label: 'Fiber', value: currentRecipe.fiber, unit: 'g', color: 'purple', icon: Wheat },
    { label: 'Cost', value: `₹${currentRecipe.costPerServing}`, unit: 'per serving', color: 'teal', icon: TrendingUp },
  ];

  const healthScore = 87; // Calculated score out of 100

  const handleServingsChange = (newServings) => {
    if (newServings >= 1 && newServings <= 20) {
      setServings(newServings);
    }
  };

  const calculateAdjustedValue = (baseValue) => {
    return ((baseValue / currentRecipe.servings) * servings).toFixed(1);
  };

  return (
    <div className="nutrition-container">
      {/* Header */}
      <div className="nutrition-header">
        <div className="header-left">
          <h1>
            <Calculator size={24} />
            Nutrition Analyzer
          </h1>
          <p>Analyze nutritional content and calculate recipe costs</p>
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
            <button className="btn-outline">
              <Share2 size={18} />
              <span>Share</span>
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="nutrition-content">
        {/* Left Panel - Recipe Selection */}
        <div className="nutrition-sidebar">
          <div className="sidebar-section">
            <h3>Select Recipe</h3>
            <div className="recipe-list">
              {recipes.map((recipe) => (
                <div 
                  key={recipe.id}
                  className={`recipe-card ${selectedRecipe === recipe.id ? 'active' : ''}`}
                  onClick={() => setSelectedRecipe(recipe.id)}
                >
                  <div className="recipe-card-header">
                    <ChefHat size={16} />
                    <h4>{recipe.name}</h4>
                    <span className="category-badge">{recipe.category}</span>
                  </div>
                  <div className="recipe-card-details">
                    <div className="detail-item">
                      <Clock size={14} />
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div className="detail-item">
                      <Users size={14} />
                      <span>{recipe.servings} servings</span>
                    </div>
                    <div className="detail-item">
                      <Zap size={14} />
                      <span>{recipe.calories} cal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-text">
              <Plus size={16} />
              <span>Add More Recipes</span>
            </button>
          </div>

          {/* Dietary Tags */}
          <div className="sidebar-section">
            <h3>Dietary Information</h3>
            <div className="dietary-tags">
              {currentRecipe.allergens.map((allergen, index) => (
                <span key={index} className="tag allergen">
                  <AlertTriangle size={12} />
                  {allergen}
                </span>
              ))}
              {currentRecipe.dietaryTags.map((tag, index) => (
                <span key={index} className="tag dietary">
                  <CheckCircle size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Health Score */}
          <div className="sidebar-section">
            <h3>Health Score</h3>
            <div className="health-score-card">
              <div className="score-circle">
                <div className="score-value">{healthScore}</div>
                <div className="score-label">/100</div>
              </div>
              <div className="score-details">
                <h4>Excellent</h4>
                <p>This recipe has a balanced nutritional profile</p>
                <div className="score-breakdown">
                  <div className="breakdown-item positive">
                    <CheckCircle size={12} />
                    <span>High in protein</span>
                  </div>
                  <div className="breakdown-item positive">
                    <CheckCircle size={12} />
                    <span>Low in sugar</span>
                  </div>
                  <div className="breakdown-item warning">
                    <AlertTriangle size={12} />
                    <span>Moderate sodium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Nutrition Analysis */}
        <div className="nutrition-main">
          {/* Recipe Header */}
          <div className="recipe-header-section">
            <div className="recipe-title">
              <h2>{currentRecipe.name}</h2>
              <div className="recipe-meta">
                <span className="meta-item">
                  <Clock size={16} />
                  {currentRecipe.prepTime + currentRecipe.cookTime} min total
                </span>
                <span className="meta-item">
                  <Users size={16} />
                  <div className="servings-control">
                    <button 
                      onClick={() => handleServingsChange(servings - 1)}
                      disabled={servings <= 1}
                    >
                      -
                    </button>
                    <span>{servings} servings</span>
                    <button 
                      onClick={() => handleServingsChange(servings + 1)}
                      disabled={servings >= 20}
                    >
                      +
                    </button>
                  </div>
                </span>
                <span className="meta-item">
                  <Scale size={16} />
                  {currentRecipe.difficulty}
                </span>
              </div>
            </div>
            <div className="recipe-actions">
              <button className="btn-outline">
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
              <button className="btn-outline">
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Nutrition Cards Grid */}
          <div className="nutrition-cards-grid">
            {nutritionData.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="nutrition-card">
                  <div className="card-icon" style={{ backgroundColor: `var(--${item.color}-light)` }}>
                    <Icon size={20} style={{ color: `var(--${item.color})` }} />
                  </div>
                  <div className="card-content">
                    <h3>{item.value}</h3>
                    <p>{item.label}</p>
                    <span className="card-unit">{item.unit}</span>
                  </div>
                  <div className="card-trend">
                    {index % 3 === 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>{index % 3 === 0 ? '+5%' : '-2%'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Macros Breakdown */}
          <div className="macros-section">
            <h3>Macronutrients Breakdown</h3>
            <div className="macros-grid">
              <div className="macro-card">
                <h4>Protein</h4>
                <div className="macro-value">
                  {calculateAdjustedValue(currentRecipe.protein)}g
                </div>
                <div className="macro-bar">
                  <div 
                    className="bar-fill protein" 
                    style={{ width: `${(currentRecipe.protein / 50) * 100}%` }}
                  ></div>
                </div>
                <div className="macro-dv">{currentRecipe.nutritionalBreakdown.macronutrients.protein.dv}% DV</div>
              </div>
              <div className="macro-card">
                <h4>Carbohydrates</h4>
                <div className="macro-value">
                  {calculateAdjustedValue(currentRecipe.carbs)}g
                </div>
                <div className="macro-bar">
                  <div 
                    className="bar-fill carbs" 
                    style={{ width: `${(currentRecipe.carbs / 130) * 100}%` }}
                  ></div>
                </div>
                <div className="macro-dv">{currentRecipe.nutritionalBreakdown.macronutrients.carbs.dv}% DV</div>
              </div>
              <div className="macro-card">
                <h4>Fat</h4>
                <div className="macro-value">
                  {calculateAdjustedValue(currentRecipe.fat)}g
                </div>
                <div className="macro-bar">
                  <div 
                    className="bar-fill fat" 
                    style={{ width: `${(currentRecipe.fat / 65) * 100}%` }}
                  ></div>
                </div>
                <div className="macro-dv">{currentRecipe.nutritionalBreakdown.macronutrients.fat.dv}% DV</div>
              </div>
            </div>
          </div>

          {/* Ingredients & Nutrition Table */}
          <div className="detailed-analysis">
            <div className="ingredients-section">
              <h3>Ingredients ({servings} servings)</h3>
              <div className="ingredients-list">
                {currentRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-row">
                    <div className="ingredient-info">
                      <span className="ingredient-name">{ingredient.name}</span>
                      <span className="ingredient-quantity">
                        {calculateAdjustedValue(ingredient.quantity)} {ingredient.unit}
                      </span>
                    </div>
                    <div className="ingredient-nutrition">
                      <span className="nutrition-value">120 cal</span>
                      <span className="nutrition-value">8g protein</span>
                      <span className="nutrition-value">$1.20</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="vitamins-section">
              <h3>Vitamins & Minerals</h3>
              <div className="vitamins-grid">
                {currentRecipe.nutritionalBreakdown.vitamins.map((vitamin, index) => (
                  <div key={index} className="vitamin-card">
                    <div className="vitamin-name">{vitamin.name}</div>
                    <div className="vitamin-value">{vitamin.value} {vitamin.unit}</div>
                    <div className="vitamin-bar">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${Math.min(vitamin.value, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="cost-analysis">
            <h3>Cost Analysis</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>Ingredients Cost</span>
                <span className="cost-value">${(currentRecipe.costPerServing * servings).toFixed(2)}</span>
              </div>
              <div className="cost-item">
                <span>Labor Cost (est.)</span>
                <span className="cost-value">${(currentRecipe.costPerServing * servings * 0.3).toFixed(2)}</span>
              </div>
              <div className="cost-item">
                <span>Overhead Cost</span>
                <span className="cost-value">${(currentRecipe.costPerServing * servings * 0.2).toFixed(2)}</span>
              </div>
              <div className="cost-item total">
                <span>Total Cost</span>
                <span className="cost-value">
                  ${(currentRecipe.costPerServing * servings * 1.5).toFixed(2)}
                </span>
              </div>
              <div className="cost-item profit">
                <span>Recommended Price (30% margin)</span>
                <span className="cost-value">
                  ${(currentRecipe.costPerServing * servings * 1.95).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components
const CheckCircle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export default RecipeNutrition;