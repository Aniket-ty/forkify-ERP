// components/ReportsAnalytics.js
import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ChefHat,
  ShoppingCart,
  Download,
  Printer,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const ReportsAnalytics = () => {
  const [dateRange, setDateRange] = useState('month');
  const [selectedReport, setSelectedReport] = useState('sales');

  // Sample data
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [12500, 14200, 16800, 18400, 21000, 24500]
  };

  const inventoryData = [
    { category: 'Vegetables', value: 25, color: '#10b981' },
    { category: 'Dairy', value: 20, color: '#3b82f6' },
    { category: 'Meat', value: 18, color: '#ef4444' },
    { category: 'Grains', value: 15, color: '#f59e0b' },
    { category: 'Spices', value: 12, color: '#0061d2' },
    { category: 'Others', value: 10, color: '#6b7280' }
  ];

  const kpis = [
    { label: 'Total Revenue', value: '$245,800', change: '+12.5%', trend: 'up', icon: DollarSign },
    { label: 'Active Recipes', value: '156', change: '+8.2%', trend: 'up', icon: ChefHat },
    { label: 'Inventory Value', value: '$48,500', change: '-2.3%', trend: 'down', icon: Package },
    { label: 'Customer Orders', value: '1,245', change: '+15.7%', trend: 'up', icon: ShoppingCart },
    { label: 'Active Suppliers', value: '24', change: '+2', trend: 'up', icon: Users },
    { label: 'Avg Order Value', value: '$198', change: '+5.2%', trend: 'up', icon: Target }
  ];

  const reports = [
    { id: 'sales', title: 'Sales Report', desc: 'Revenue and sales trends', icon: DollarSign },
    { id: 'inventory', title: 'Inventory Report', desc: 'Stock levels and turnover', icon: Package },
    { id: 'recipes', title: 'Recipe Performance', desc: 'Top recipes and profitability', icon: ChefHat },
    { id: 'suppliers', title: 'Supplier Analysis', desc: 'Supplier performance and costs', icon: Users },
    { id: 'waste', title: 'Waste Analysis', desc: 'Food waste and cost analysis', icon: AlertTriangle },
    { id: 'nutrition', title: 'Nutrition Report', desc: 'Nutritional content analysis', icon: Activity }
  ];

  const topRecipes = [
    { name: 'Margherita Pizza', orders: 156, revenue: '$1,950', profit: '$780', rating: 4.8 },
    { name: 'Caesar Salad', orders: 142, revenue: '$1,420', profit: '$568', rating: 4.6 },
    { name: 'Spaghetti Carbonara', orders: 128, revenue: '$1,664', profit: '$666', rating: 4.7 },
    { name: 'Grilled Salmon', orders: 98, revenue: '$1,960', profit: '$882', rating: 4.9 },
    { name: 'Chocolate Mousse', orders: 112, revenue: '$1,120', profit: '$504', rating: 4.8 }
  ];

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
          <h1><BarChart3 size={24} /> Reports & Analytics</h1>
          <p>Analyze performance, generate reports, and gain insights</p>
        </div>
        <div className="header-right">
          <div className="date-range-selector">
            <Calendar size={18} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="action-buttons">
            <button className="btn-outline">
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="btn-outline">
              <Download size={18} />
              <span>Export</span>
            </button>
            <button className="btn-outline">
              <Printer size={18} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <Icon size={20} />
                </div>
                <span className={`trend ${kpi.trend}`}>
                  {kpi.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {kpi.change}
                </span>
              </div>
              <div className="kpi-content">
                <h3>{kpi.value}</h3>
                <p>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="reports-content">
        {/* Left Sidebar - Report Types */}
        <div className="reports-sidebar">
          <h3>Report Types</h3>
          <div className="report-types">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  className={`report-type-card ${selectedReport === report.id ? 'active' : ''}`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="report-icon">
                    <Icon size={20} />
                  </div>
                  <div className="report-info">
                    <h4>{report.title}</h4>
                    <p>{report.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="quick-metrics">
            <h3>Quick Metrics</h3>
            <div className="metric-cards">
              <div className="metric-card">
                <div className="metric-value">98%</div>
                <div className="metric-label">Order Accuracy</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">24 hrs</div>
                <div className="metric-label">Avg Delivery Time</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">4.7</div>
                <div className="metric-label">Avg Customer Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Charts & Data */}
        <div className="reports-main">
          {/* Sales Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h3>Sales Trend - Last 6 Months</h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>Revenue</span>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {salesData.values.map((value, index) => (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-label">{salesData.labels[index]}</div>
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(value / 25000) * 100}%`,
                          backgroundColor: '#3b82f6'
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">${value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Distribution */}
          <div className="chart-section">
            <div className="chart-header">
              <h3>Inventory Distribution by Category</h3>
            </div>
            <div className="chart-container">
              <div className="pie-chart">
                <div className="pie-chart-visual">
                  <div className="pie-chart-circle">
                    {inventoryData.map((item, index, arr) => {
                      const total = arr.reduce((sum, d) => sum + d.value, 0);
                      const startAngle = arr.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                      const angle = (item.value / total) * 360;
                      
                      return (
                        <div
                          key={index}
                          className="pie-segment"
                          style={{
                            backgroundColor: item.color,
                            transform: `rotate(${startAngle}deg)`,
                            clipPath: `conic-gradient(transparent 0deg, transparent ${angle}deg, ${item.color} ${angle}deg, ${item.color} 360deg)`
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>
                <div className="pie-chart-legend">
                  {inventoryData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                      <div className="legend-text">
                        <span className="legend-label">{item.category}</span>
                        <span className="legend-value">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Recipes Table */}
          <div className="table-section">
            <div className="section-header">
              <h3>Top Performing Recipes</h3>
              <button className="btn-text">View All</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipe</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Rating</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {topRecipes.map((recipe, index) => (
                  <tr key={index}>
                    <td>
                      <div className="recipe-info">
                        <ChefHat size={16} />
                        <span>{recipe.name}</span>
                      </div>
                    </td>
                    <td>{recipe.orders}</td>
                    <td className="text-bold">{recipe.revenue}</td>
                    <td className="text-bold" style={{ color: '#10b981' }}>{recipe.profit}</td>
                    <td>
                      <div className="rating">
                        <Star size={14} fill="currentColor" />
                        <span>{recipe.rating}</span>
                      </div>
                    </td>
                    <td>
                      <div className="profit-margin">
                        <div className="margin-bar">
                          <div 
                            className="margin-fill" 
                            style={{ width: '40%' }}
                          ></div>
                        </div>
                        <span>40%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights & Recommendations */}
          <div className="insights-section">
            <h3>Insights & Recommendations</h3>
            <div className="insights-grid">
              <div className="insight-card positive">
                <Award size={20} />
                <div className="insight-content">
                  <h4>Top Performer</h4>
                  <p>Grilled Salmon has the highest profit margin at 45%</p>
                </div>
              </div>
              <div className="insight-card warning">
                <AlertTriangle size={20} />
                <div className="insight-content">
                  <h4>Waste Reduction</h4>
                  <p>Reduce vegetable waste by 15% through better inventory planning</p>
                </div>
              </div>
              <div className="insight-card info">
                <TrendingUp size={20} />
                <div className="insight-content">
                  <h4>Growth Opportunity</h4>
                  <p>Add 3 new seafood recipes to capture market demand</p>
                </div>
              </div>
              <div className="insight-card neutral">
                <Clock size={20} />
                <div className="insight-content">
                  <h4>Efficiency</h4>
                  <p>Reduce average prep time by optimizing 5 high-volume recipes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Star icon component
const Star = ({ size, fill = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

export default ReportsAnalytics;