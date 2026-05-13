// components/SupplierManagement.js
import React, { useState } from 'react';
import {
  Truck,
  Users,
  Phone,
  Mail,
  Globe,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Package,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Filter,
  Download,
  Plus,
  Search,
  AlertTriangle
} from 'lucide-react';

const SupplierManagement = () => {
  const [selectedSupplier, setSelectedSupplier] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample suppliers data
  const suppliers = [
    {
      id: 1,
      name: 'Fresh Farms Co.',
      category: 'Produce',
      contact: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john@freshfarms.com',
      website: 'www.freshfarms.com',
      rating: 4.8,
      orders: 156,
      totalSpent: 24580,
      avgDeliveryTime: '24 hours',
      reliability: 98,
      status: 'active',
      lastOrder: '2024-01-15',
      paymentTerms: 'Net 30',
      products: ['Vegetables', 'Fruits', 'Herbs']
    },
    {
      id: 2,
      name: 'Spice Masters',
      category: 'Spices',
      contact: 'Maria Garcia',
      phone: '(555) 987-6543',
      email: 'maria@spicemasters.com',
      website: 'www.spicemasters.com',
      rating: 4.6,
      orders: 89,
      totalSpent: 18450,
      avgDeliveryTime: '48 hours',
      reliability: 95,
      status: 'active',
      lastOrder: '2024-01-14',
      paymentTerms: 'Net 15',
      products: ['Spices', 'Herbs', 'Seasonings']
    },
    {
      id: 3,
      name: 'Dairy Delight',
      category: 'Dairy',
      contact: 'Robert Johnson',
      phone: '(555) 456-7890',
      email: 'robert@dairydelight.com',
      website: 'www.dairydelight.com',
      rating: 4.9,
      orders: 203,
      totalSpent: 32890,
      avgDeliveryTime: '12 hours',
      reliability: 99,
      status: 'active',
      lastOrder: '2024-01-16',
      paymentTerms: 'Net 30',
      products: ['Milk', 'Cheese', 'Yogurt', 'Butter']
    },
    {
      id: 4,
      name: 'Meat Market',
      category: 'Meat',
      contact: 'Sarah Wilson',
      phone: '(555) 234-5678',
      email: 'sarah@meatmarket.com',
      website: 'www.meatmarket.com',
      rating: 4.7,
      orders: 124,
      totalSpent: 45230,
      avgDeliveryTime: '36 hours',
      reliability: 96,
      status: 'warning',
      lastOrder: '2024-01-10',
      paymentTerms: 'COD',
      products: ['Beef', 'Chicken', 'Pork', 'Lamb']
    },
    {
      id: 5,
      name: 'Ocean Fresh Seafood',
      category: 'Seafood',
      contact: 'David Lee',
      phone: '(555) 345-6789',
      email: 'david@oceanfresh.com',
      website: 'www.oceanfresh.com',
      rating: 4.5,
      orders: 78,
      totalSpent: 19870,
      avgDeliveryTime: '72 hours',
      reliability: 92,
      status: 'active',
      lastOrder: '2024-01-13',
      paymentTerms: 'Net 30',
      products: ['Fish', 'Shrimp', 'Scallops', 'Crab']
    }
  ];

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier) || suppliers[0];

  const supplierStats = [
    { label: 'Active Suppliers', value: '24', change: '+3', trend: 'up' },
    { label: 'Total Orders', value: '1,245', change: '+12%', trend: 'up' },
    { label: 'Avg Rating', value: '4.7', change: '+0.1', trend: 'up' },
    { label: 'Total Spent', value: '₹245,800', change: '+8.5%', trend: 'up' }
  ];

  const recentOrders = [
    { id: '#PO-001', supplier: 'Fresh Farms Co.', amount: '₹1,250', status: 'delivered', date: '2024-01-15' },
    { id: '#PO-002', supplier: 'Spice Masters', amount: '₹850', status: 'processing', date: '2024-01-16' },
    { id: '#PO-003', supplier: 'Dairy Delight', amount: '₹1,450', status: 'delivered', date: '2024-01-14' },
    { id: '#PO-004', supplier: 'Meat Market', amount: '₹2,150', status: 'pending', date: '2024-01-16' },
    { id: '#PO-005', supplier: 'Ocean Fresh', amount: '₹980', status: 'processing', date: '2024-01-15' }
  ];

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'green', icon: CheckCircle, label: 'Active' },
      warning: { color: 'orange', icon: AlertTriangle, label: 'Warning' },
      inactive: { color: 'red', icon: XCircle, label: 'Inactive' }
    };
    
    const { color, icon: Icon, label } = config[status] || config.active;
    
    return (
      <span className={`status-badge ${status}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  return (
    <div className="supplier-container">
      {/* Header */}
      <div className="supplier-header">
        <div className="header-left">
          <h1><Truck size={24} /> Supplier Management</h1>
          <p>Manage suppliers, track performance, and monitor orders</p>
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
            <button className="btn-primary">
              <Plus size={18} />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="supplier-stats-grid">
        {supplierStats.map((stat, index) => (
          <div key={index} className="supplier-stat-card">
            <div className="stat-header">
              <Truck size={20} />
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

      <div className="supplier-content">
        {/* Left Sidebar - Supplier List */}
        <div className="supplier-sidebar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="supplier-list">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={`supplier-card ${selectedSupplier === supplier.id ? 'active' : ''}`}
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                <div className="supplier-card-header">
                  <div className="supplier-avatar">
                    <Truck size={16} />
                  </div>
                  <div className="supplier-info">
                    <h4>{supplier.name}</h4>
                    <span className="supplier-category">{supplier.category}</span>
                  </div>
                  <div className="supplier-rating">
                    <Star size={12} fill="currentColor" />
                    <span>{supplier.rating}</span>
                  </div>
                </div>
                <div className="supplier-card-details">
                  <div className="detail-item">
                    <Package size={12} />
                    <span>{supplier.orders} orders</span>
                  </div>
                  <div className="detail-item">
                    <IndianRupee size={12} />
                    <span>₹{(supplier.totalSpent / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="detail-item">
                    {getStatusBadge(supplier.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-text">
            <Plus size={16} />
            <span>View All Suppliers</span>
          </button>
        </div>

        {/* Main Content - Supplier Details */}
        <div className="supplier-main">
          {/* Supplier Header */}
          <div className="supplier-detail-header">
            <div className="supplier-title">
              <div className="supplier-avatar-large">
                <Truck size={24} />
              </div>
              <div className="supplier-title-info">
                <h2>{selectedSupplierData.name}</h2>
                <div className="supplier-meta">
                  <span className="meta-item">
                    <Star size={16} fill="currentColor" />
                    {selectedSupplierData.rating} Rating
                  </span>
                  <span className="meta-item">
                    <CheckCircle size={16} />
                    {selectedSupplierData.reliability}% Reliability
                  </span>
                  <span className="meta-item">
                    <Package size={16} />
                    {selectedSupplierData.orders} Orders
                  </span>
                </div>
              </div>
            </div>
            <div className="supplier-actions">
              <button className="btn-outline">
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
              <button className="btn-outline">
                <Eye size={16} />
                <span>View Orders</span>
              </button>
              <button className="btn-outline btn-danger">
                <Trash2 size={16} />
                <span>Deactivate</span>
              </button>
            </div>
          </div>

          {/* Supplier Info Grid */}
          <div className="supplier-info-grid">
            <div className="info-card">
              <h3>Contact Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <Users size={16} />
                  <div className="item-details">
                    <div className="item-label">Contact Person</div>
                    <div className="item-value">{selectedSupplierData.contact}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={16} />
                  <div className="item-details">
                    <div className="item-label">Phone</div>
                    <div className="item-value">{selectedSupplierData.phone}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Mail size={16} />
                  <div className="item-details">
                    <div className="item-label">Email</div>
                    <div className="item-value">{selectedSupplierData.email}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Globe size={16} />
                  <div className="item-details">
                    <div className="item-label">Website</div>
                    <div className="item-value">
                      <a href={`https://${selectedSupplierData.website}`} target="_blank" rel="noopener noreferrer">
                        {selectedSupplierData.website}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Business Details</h3>
              <div className="info-list">
                <div className="info-item">
                  <Package size={16} />
                  <div className="item-details">
                    <div className="item-label">Category</div>
                    <div className="item-value">{selectedSupplierData.category}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Clock size={16} />
                  <div className="item-details">
                    <div className="item-label">Avg Delivery Time</div>
                    <div className="item-value">{selectedSupplierData.avgDeliveryTime}</div>
                  </div>
                </div>
                <div className="info-item">
                  <IndianRupee size={16} />
                  <div className="item-details">
                    <div className="item-label">Payment Terms</div>
                    <div className="item-value">{selectedSupplierData.paymentTerms}</div>
                  </div>
                </div>
                <div className="info-item">
                  <CheckCircle size={16} />
                  <div className="item-details">
                    <div className="item-label">Last Order</div>
                    <div className="item-value">{selectedSupplierData.lastOrder}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Financial Summary</h3>
              <div className="financial-stats">
                <div className="financial-stat">
                  <div className="stat-label">Total Spent</div>
                  <div className="stat-value">₹{selectedSupplierData.totalSpent.toLocaleString()}</div>
                  <div className="stat-trend up">+12.5%</div>
                </div>
                <div className="financial-stat">
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value">₹{(selectedSupplierData.totalSpent / selectedSupplierData.orders).toFixed(0)}</div>
                  <div className="stat-trend up">+5.2%</div>
                </div>
                <div className="financial-stat">
                  <div className="stat-label">Orders This Month</div>
                  <div className="stat-value">18</div>
                  <div className="stat-trend down">-2</div>
                </div>
                <div className="financial-stat">
                  <div className="stat-label">Outstanding</div>
                  <div className="stat-value">₹2,450</div>
                  <div className="stat-trend neutral">Due in 15 days</div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Products & Services</h3>
              <div className="products-list">
                {selectedSupplierData.products.map((product, index) => (
                  <span key={index} className="product-tag">
                    {product}
                  </span>
                ))}
              </div>
              <div className="performance-meter">
                <div className="meter-label">Performance Score</div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill" 
                    style={{ width: `${selectedSupplierData.reliability}%` }}
                  ></div>
                </div>
                <div className="meter-value">{selectedSupplierData.reliability}/100</div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="recent-orders">
            <div className="section-header">
              <h3>Recent Orders</h3>
              <button className="btn-text">View All</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.supplier}</td>
                    <td className="text-bold">{order.amount}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <div className="action-buttons-small">
                        <button className="btn-icon-xs" title="View">
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon-xs" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-panel">
            <h3>Supplier Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-card">
                <Plus size={20} />
                <span>Place Order</span>
              </button>
              <button className="quick-action-card">
                <Mail size={20} />
                <span>Send Message</span>
              </button>
              <button className="quick-action-card">
                <IndianRupee size={20} />
                <span>Make Payment</span>
              </button>
              <button className="quick-action-card">
                <Download size={20} />
                <span>Download Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;