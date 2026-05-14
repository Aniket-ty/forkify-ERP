// components/InventoryManagement.js
import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Printer,
  Eye,
  MoreVertical,
  Thermometer,ShoppingCart,
  Calendar
} from 'lucide-react';


const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Sample Inventory Data
  const inventoryItems = [
    {
      id: 1,
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      sku: 'VEG-001',
      currentStock: 12,
      minStock: 25,
      unit: 'kg',
      unitCost: '₹2.50',
      totalValue: '₹30.00',
      location: 'Cool Room A1',
      supplier: 'Fresh Farms Co.',
      lastUpdated: '2024-01-15',
      expiryDate: '2024-01-25',
      status: 'low',
      temperature: '4°C'
    },
    {
      id: 2,
      name: 'Basil Leaves',
      category: 'Herbs',
      sku: 'HER-002',
      currentStock: 8,
      minStock: 15,
      unit: 'pack',
      unitCost: '₹3.20',
      totalValue: '₹25.60',
      location: 'Herb Rack B2',
      supplier: 'Spice Masters',
      lastUpdated: '2024-01-16',
      expiryDate: '2024-01-30',
      status: 'low',
      temperature: '6°C'
    },
    {
      id: 3,
      name: 'Olive Oil',
      category: 'Oils',
      sku: 'OIL-003',
      currentStock: 3,
      minStock: 10,
      unit: 'L',
      unitCost: '₹15.00',
      totalValue: '₹45.00',
      location: 'Dry Storage C3',
      supplier: 'Mediterranean Oils',
      lastUpdated: '2024-01-10',
      expiryDate: '2024-12-15',
      status: 'critical',
      temperature: 'Room Temp'
    },
    {
      id: 4,
      name: 'Garlic',
      category: 'Vegetables',
      sku: 'VEG-004',
      currentStock: 5,
      minStock: 20,
      unit: 'kg',
      unitCost: '₹4.00',
      totalValue: '₹20.00',
      location: 'Cool Room A2',
      supplier: 'Fresh Farms Co.',
      lastUpdated: '2024-01-14',
      expiryDate: '2024-02-14',
      status: 'low',
      temperature: '4°C'
    },
    {
      id: 5,
      name: 'Parmesan Cheese',
      category: 'Dairy',
      sku: 'DAI-005',
      currentStock: 7,
      minStock: 15,
      unit: 'kg',
      unitCost: '₹18.50',
      totalValue: '₹129.50',
      location: 'Cool Room B1',
      supplier: 'Dairy Delight',
      lastUpdated: '2024-01-13',
      expiryDate: '2024-02-28',
      status: 'low',
      temperature: '2°C'
    },
    {
      id: 6,
      name: 'Wheat Flour',
      category: 'Grains',
      sku: 'GRA-006',
      currentStock: 45,
      minStock: 20,
      unit: 'kg',
      unitCost: '₹1.80',
      totalValue: '₹81.00',
      location: 'Dry Storage C1',
      supplier: 'Grain Masters',
      lastUpdated: '2024-01-05',
      expiryDate: '2024-06-15',
      status: 'good',
      temperature: 'Room Temp'
    },
    {
      id: 7,
      name: 'Eggs',
      category: 'Dairy',
      sku: 'DAI-007',
      currentStock: 24,
      minStock: 30,
      unit: 'dozen',
      unitCost: '₹4.50',
      totalValue: '₹108.00',
      location: 'Cool Room A3',
      supplier: 'Fresh Farms Co.',
      lastUpdated: '2024-01-16',
      expiryDate: '2024-02-05',
      status: 'warning',
      temperature: '4°C'
    },
    {
      id: 8,
      name: 'Black Pepper',
      category: 'Spices',
      sku: 'SPI-008',
      currentStock: 12,
      minStock: 8,
      unit: 'kg',
      unitCost: '₹22.00',
      totalValue: '₹264.00',
      location: 'Dry Storage C2',
      supplier: 'Spice Masters',
      lastUpdated: '2024-01-02',
      expiryDate: '2025-01-02',
      status: 'good',
      temperature: 'Room Temp'
    }
  ];

  // Inventory Stats
  const inventoryStats = [
    { label: 'Total Items', value: '156', change: '+8%', trend: 'up' },
    { label: 'Low Stock Items', value: '24', change: '-3', trend: 'down' },
    { label: 'Expiring Soon', value: '12', change: '+4', trend: 'up' },
    { label: 'Total Value', value: '₹8,450', change: '+2.5%', trend: 'up' },
  ];

  // Categories
  const categories = [
    { name: 'All Items', count: 156, color: 'blue' },
    { name: 'Vegetables', count: 42, color: 'green' },
    { name: 'Dairy', count: 28, color: 'yellow' },
    { name: 'Meat & Poultry', count: 24, color: 'red' },
    { name: 'Grains', count: 18, color: 'orange' },
    { name: 'Spices', count: 32, color: 'purple' },
    { name: 'Oils', count: 12, color: 'teal' },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      critical: { color: 'red', icon: AlertTriangle, label: 'Critical' },
      low: { color: 'orange', icon: AlertTriangle, label: 'Low' },
      warning: { color: 'yellow', icon: AlertTriangle, label: 'Warning' },
      good: { color: 'green', icon: CheckCircle, label: 'Good' },
    };
    
    const config = statusConfig[status] || statusConfig.good;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge ${status}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inventoryItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventoryItems.map(item => item.id));
    }
  };
 const customButtons = [
    {
      label: 'Restock',
      icon: <ShoppingCart size={18} />,
      onClick: () => console.log('Restock clicked'),
      variant: 'secondary'
    },
    {
      label: 'Generate Report',
      icon: <BarChart3 size={18} />,
      onClick: () => console.log('Report clicked'),
      variant: 'secondary'
    }
  ];

  const customStats = [
    { label: 'Total Items', value: '156', icon: Package, change: '+8%', changeType: 'positive' },
    { label: 'Low Stock', value: '24', icon: AlertTriangle, change: '-3', changeType: 'negative' },
  ];

  const customTabs = [
    { id: 'all', label: 'All Items' },
    { id: 'low-stock', label: 'Low Stock' },
    { id: 'expiring', label: 'Expiring Soon' },
  ];
const handleSearch = (query) => {
    console.log('Searching for:', query);
    // Implement search logic
  };
  return (
    <>
     

    <div className="inventory-container">
      {/* Inventory Header */}
      <div className="inventory-header">
        <div className="header-left">
          <h1>Inventory Management</h1>
          <p>Manage stock levels, track inventory, and set alerts</p>
        </div>
        <div className="header-right">
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
            <button className="btn-primary">
              <Plus size={18} />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="inventory-stats-grid">
        {inventoryStats.map((stat, index) => (
          <div key={index} className="inventory-stat-card">
            <div className="stat-header">
              <Package size={20} />
              <span className={`trend ${stat.trend}`}>
                {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {stat.change}
              </span>
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Filter */}
      <div className="categories-section">
        <div className="categories-header">
          <h3>Categories</h3>
          <button className="btn-text">View All</button>
        </div>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className={`category-card ${activeTab === category.name.toLowerCase() ? 'active' : ''}`}
              onClick={() => setActiveTab(category.name.toLowerCase())}
            >
              <div className="category-icon" style={{ backgroundColor: `var(--${category.color}-light)` }}>
                <Package size={20} style={{ color: `var(--${category.color})` }} />
              </div>
              <div className="category-info">
                <h4>{category.name}</h4>
                <p>{category.count} items</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="search-actions-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bulk-actions">
          {selectedItems.length > 0 && (
            <div className="selected-count">
              {selectedItems.length} items selected
            </div>
          )}
          <button className="btn-outline" disabled={selectedItems.length === 0}>
            <Edit2 size={16} />
            <span>Edit Selected</span>
          </button>
          <button className="btn-outline btn-danger" disabled={selectedItems.length === 0}>
            <Trash2 size={16} />
            <span>Delete Selected</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="data-table inventory-table">
          <thead>
            <tr>
              <th width="50">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === inventoryItems.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Item Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Location</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id} className={item.status === 'critical' ? 'critical-row' : ''}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                </td>
                <td>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-supplier">{item.supplier}</div>
                  </div>
                </td>
                <td>
                  <span className="sku-badge">{item.sku}</span>
                </td>
                <td>
                  <span className="category-badge">{item.category}</span>
                </td>
                <td>
                  <div className="stock-info">
                    <span className="stock-value">{item.currentStock} {item.unit}</span>
                    <div className="stock-progress">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${(item.currentStock / item.minStock) * 100}%`,
                          backgroundColor: item.status === 'critical' ? '#ef4444' : 
                                          item.status === 'low' ? '#f59e0b' : 
                                          item.status === 'warning' ? '#eab308' : '#10b981'
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>{item.minStock} {item.unit}</td>
                <td className="text-bold">{item.unitCost}</td>
                <td className="text-bold">{item.totalValue}</td>
                <td>
                  <div className="location-info">
                    <Package size={14} />
                    <span>{item.location}</span>
                    {item.temperature && (
                      <span className="temp-badge">
                        <Thermometer size={12} />
                        {item.temperature}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="expiry-info">
                    <Calendar size={14} />
                    <span>{item.expiryDate}</span>
                  </div>
                </td>
                <td>{getStatusBadge(item.status)}</td>
                <td>
                  <div className="action-buttons-small">
                    <button className="btn-icon-xs" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon-xs" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon-xs" title="Delete">
                      <Trash2 size={14} />
                    </button>
                    <button className="btn-icon-xs" title="More">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing 8 of 156 items
        </div>
        <div className="pagination-controls">
          <button className="pagination-button" disabled>
            Previous
          </button>
          <button className="pagination-button active">1</button>
          <button className="pagination-button">2</button>
          <button className="pagination-button">3</button>
          <span className="pagination-ellipsis">...</span>
          <button className="pagination-button">20</button>
          <button className="pagination-button">
            Next
          </button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="quick-actions-panel">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <ShoppingCart size={20} />
            <span>Restock Items</span>
          </button>
          <button className="quick-action-card">
            <BarChart3 size={20} />
            <span>Stock Report</span>
          </button>
          <button className="quick-action-card">
            <AlertTriangle size={20} />
            <span>Set Alerts</span>
          </button>
          <button className="quick-action-card">
            <Download size={20} />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div></>
  );
};

export default InventoryManagement;