import React, { useState, useEffect } from 'react';
import { User, Package, ShoppingCart, BarChart3, Settings, LogOut, Plus, Search, Filter, Eye, Edit, Trash2, Download, Bell, X, Save } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

const OrderManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Auth states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', role: 'user' });

  // Order states
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    items: [{ productId: '', name: '', quantity: 1, price: 0 }],
    paymentReceived: false
  });
  const [orderFilters, setOrderFilters] = useState({ status: '', customerName: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  // Inventory states
  const [inventoryForm, setInventoryForm] = useState({ productId: '', name: '', quantity: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    }
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check if the server is running and CORS is configured');
      }
      throw error;
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiCall('/auth/profile');
      setCurrentUser(data.data);
      setCurrentView('dashboard');
      if (data.data.role === 'admin') fetchStats();
    } catch (error) {
      localStorage.removeItem('token');
      addNotification('Session expired. Please login again.', 'error');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(orderFilters).toString();
      const data = await apiCall(`/osm?${params}`);
      setOrders(data);
    } catch (error) {
      addNotification('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/inventory');
      setInventory(data);
    } catch (error) {
      addNotification('Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/admin/users');
      setUsers(data.data.users);
    } catch (error) {
      addNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiCall('/admin/stats');
      setStats(data.data);
    } catch (error) {
      addNotification('Failed to fetch statistics', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      
      localStorage.setItem('token', data.data.token);
      setCurrentUser(data.data.user);
      setCurrentView('dashboard');
      addNotification('Login successful!', 'success');
      if (data.data.user.role === 'admin') fetchStats();
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupForm)
      });
      
      localStorage.setItem('token', data.data.token);
      setCurrentUser(data.data.user);
      setCurrentView('dashboard');
      addNotification('Account created successfully!', 'success');
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentView('login');
    addNotification('Logged out successfully', 'success');
  };

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiCall('/osm', {
        method: 'POST',
        body: JSON.stringify(orderForm)
      });
      
      addNotification('Order created successfully!', 'success');
      setOrderForm({
        customerName: '',
        items: [{ productId: '', name: '', quantity: 1, price: 0 }],
        paymentReceived: false
      });
      fetchOrders();
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiCall(`/osm/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      
      addNotification('Order status updated!', 'success');
      fetchOrders();
    } catch (error) {
      addNotification(error.message, 'error');
    }
  };

  // New functions for view, edit, delete orders
  const viewOrder = (order) => {
    setSelectedOrder(order);
    setCurrentView('view-order');
  };

  const editOrder = (order) => {
    setEditingOrder({ ...order });
    setCurrentView('edit-order');
  };

  const updateOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiCall(`/osm/${editingOrder._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerName: editingOrder.customerName,
          items: editingOrder.items,
          paymentReceived: editingOrder.paymentReceived
        })
      });
      
      addNotification('Order updated successfully!', 'success');
      setEditingOrder(null);
      setCurrentView('orders');
      fetchOrders();
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await apiCall(`/osm/${orderId}`, {
          method: 'DELETE'
        });
        
        addNotification('Order deleted successfully!', 'success');
        fetchOrders();
      } catch (error) {
        addNotification(error.message, 'error');
      }
    }
  };

  const addInventoryItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiCall('/inventory', {
        method: 'POST',
        body: JSON.stringify(inventoryForm)
      });
      
      addNotification('Inventory item added!', 'success');
      setInventoryForm({ productId: '', name: '', quantity: 0 });
      fetchInventory();
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeOrderItem = (index) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Helper functions for editing orders
  const addEditOrderItem = () => {
    setEditingOrder(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeEditOrderItem = (index) => {
    setEditingOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateEditOrderItem = (index, field, value) => {
    setEditingOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      PAID: '#10b981',
      FULFILLED: '#3b82f6',
      CANCELLED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Navigation Component
  const Navigation = () => (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>
        <Package size={24} />
        <span>OrderMS</span>
      </div>
      
      <div style={styles.navMenu}>
        <button 
          style={{...styles.navButton, ...(currentView === 'dashboard' ? styles.navButtonActive : {})}}
          onClick={() => setCurrentView('dashboard')}
        >
          <BarChart3 size={18} />
          Dashboard
        </button>
        
        <button 
          style={{...styles.navButton, ...(currentView === 'orders' ? styles.navButtonActive : {})}}
          onClick={() => {setCurrentView('orders'); fetchOrders();}}
        >
          <ShoppingCart size={18} />
          Orders
        </button>
        
        <button 
          style={{...styles.navButton, ...(currentView === 'inventory' ? styles.navButtonActive : {})}}
          onClick={() => {setCurrentView('inventory'); fetchInventory();}}
        >
          <Package size={18} />
          Inventory
        </button>
        
        {currentUser?.role === 'admin' && (
          <button 
            style={{...styles.navButton, ...(currentView === 'users' ? styles.navButtonActive : {})}}
            onClick={() => {setCurrentView('users'); fetchUsers();}}
          >
            <User size={18} />
            Users
          </button>
        )}
        
        <button 
          style={{...styles.navButton, ...(currentView === 'profile' ? styles.navButtonActive : {})}}
          onClick={() => setCurrentView('profile')}
        >
          <Settings size={18} />
          Profile
        </button>
      </div>
      
      <div style={styles.navUser}>
        <span style={styles.userName}>{currentUser?.username}</span>
        <button style={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );

  // Notification Component
  const NotificationContainer = () => (
    <div style={styles.notificationContainer}>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          style={{...styles.notification, backgroundColor: getNotificationColor(notification.type)}}
        >
          <Bell size={16} />
          {notification.message}
        </div>
      ))}
    </div>
  );

  const getNotificationColor = (type) => {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || '#6b7280';
  };

  // Login/Signup View
  if (currentView === 'login' || currentView === 'signup') {
    return (
      <div style={styles.authContainer}>
        <NotificationContainer />
        <div style={styles.authBox}>
          <div style={styles.authHeader}>
            <Package size={32} />
            <h1>Order Management System</h1>
          </div>
          
          {currentView === 'login' ? (
            <form onSubmit={handleLogin} style={styles.authForm}>
              <h2>Login</h2>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
                style={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({...prev, password: e.target.value}))}
                style={styles.input}
                required
              />
              <button type="submit" style={styles.authButton} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p style={styles.authSwitch}>
                Don't have an account? 
                <button type="button" onClick={() => setCurrentView('signup')} style={styles.linkButton}>
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={styles.authForm}>
              <h2>Sign Up</h2>
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={(e) => setSignupForm(prev => ({...prev, username: e.target.value}))}
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={(e) => setSignupForm(prev => ({...prev, email: e.target.value}))}
                style={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={(e) => setSignupForm(prev => ({...prev, password: e.target.value}))}
                style={styles.input}
                required
              />
              <select
                value={signupForm.role}
                onChange={(e) => setSignupForm(prev => ({...prev, role: e.target.value}))}
                style={styles.input}
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
              </select>
              <button type="submit" style={styles.authButton} disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <p style={styles.authSwitch}>
                Already have an account? 
                <button type="button" onClick={() => setCurrentView('login')} style={styles.linkButton}>
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main App Layout
  return (
    <div style={styles.app}>
      <Navigation />
      <NotificationContainer />
      
      <main style={styles.main}>
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div style={styles.dashboard}>
            <h1>Dashboard</h1>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <User size={24} />
                </div>
                <div style={styles.statContent}>
                  <h3>Total Users</h3>
                  <p style={styles.statNumber}>{stats.users?.total || 0}</p>
                </div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <ShoppingCart size={24} />
                </div>
                <div style={styles.statContent}>
                  <h3>Orders</h3>
                  <p style={styles.statNumber}>{stats.orders?.total || 0}</p>
                </div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <Package size={24} />
                </div>
                <div style={styles.statContent}>
                  <h3>Inventory Items</h3>
                  <p style={styles.statNumber}>{stats.inventory?.total || 0}</p>
                </div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <BarChart3 size={24} />
                </div>
                <div style={styles.statContent}>
                  <h3>Pending Orders</h3>
                  <p style={styles.statNumber}>{stats.orders?.pending || 0}</p>
                </div>
              </div>
            </div>
            
            {stats.orders?.recent && (
              <div style={styles.recentOrders}>
                <h3>Recent Orders</h3>
                <div style={styles.table}>
                  <div style={styles.tableHeader}>
                    <span>Customer</span>
                    <span>Status</span>
                    <span>Date</span>
                  </div>
                  {stats.orders.recent.map(order => (
                    <div key={order._id} style={styles.tableRow}>
                      <span>{order.customerName}</span>
                      <span style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status)}}>
                        {order.status}
                      </span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders View */}
        {currentView === 'orders' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Orders</h1>
              <button 
                style={styles.primaryButton}
                onClick={() => setCurrentView('create-order')}
              >
                <Plus size={18} />
                Create Order
              </button>
            </div>
            
            <div style={styles.filters}>
              <div style={styles.filterGroup}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by customer name"
                  value={orderFilters.customerName}
                  onChange={(e) => setOrderFilters(prev => ({...prev, customerName: e.target.value}))}
                  style={styles.searchInput}
                />
              </div>
              
              <select
                value={orderFilters.status}
                onChange={(e) => setOrderFilters(prev => ({...prev, status: e.target.value}))}
                style={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              
              <button style={styles.secondaryButton} onClick={fetchOrders}>
                <Filter size={18} />
                Apply Filters
              </button>
            </div>
            
            {loading ? (
              <div style={styles.loading}>Loading orders...</div>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span>Customer</span>
                  <span>Items</span>
                  <span>Status</span>
                  <span>Payment</span>
                  <span>Date</span>
                  <span>Actions</span>
                </div>
                {orders.map(order => (
                  <div key={order._id} style={styles.tableRow}>
                    <span>{order.customerName}</span>
                    <span>{order.items?.length || 0} items</span>
                    <span style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status)}}>
                      {order.status}
                    </span>
                    <span style={{color: order.paymentReceived ? '#10b981' : '#ef4444'}}>
                      {order.paymentReceived ? 'Paid' : 'Unpaid'}
                    </span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <div style={styles.actionButtons}>
                      <button 
                        style={styles.iconButton} 
                        onClick={() => viewOrder(order)}
                        title="View Order"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        style={styles.iconButton}
                        onClick={() => editOrder(order)}
                        title="Edit Order"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        style={{...styles.iconButton, color: '#ef4444', borderColor: '#ef4444'}}
                        onClick={() => deleteOrder(order._id)}
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                      {order.status === 'PENDING' && (
                        <>
                          <button 
                            style={styles.iconButton}
                            onClick={() => updateOrderStatus(order._id, 'PAID')}
                            title="Mark as Paid"
                          >
                            Mark Paid
                          </button>
                          <button 
                            style={styles.iconButton}
                            onClick={() => updateOrderStatus(order._id, 'CANCELLED')}
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'PAID' && (
                        <button 
                          style={styles.iconButton}
                          onClick={() => updateOrderStatus(order._id, 'FULFILLED')}
                          title="Mark as Fulfilled"
                        >
                          Fulfill
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Order View */}
        {currentView === 'view-order' && selectedOrder && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Order Details</h1>
              <button 
                style={styles.secondaryButton}
                onClick={() => setCurrentView('orders')}
              >
                <X size={18} />
                Close
              </button>
            </div>
            
            <div style={styles.orderDetails}>
              <div style={styles.orderHeader}>
                <div style={styles.orderInfo}>
                  <h2>Order #{selectedOrder._id}</h2>
                  <p style={styles.orderDate}>
                    Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(selectedOrder.status)}}>
                  {selectedOrder.status}
                </span>
              </div>
              
              <div style={styles.orderSection}>
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                <p><strong>Payment Status:</strong> 
                  <span style={{color: selectedOrder.paymentReceived ? '#10b981' : '#ef4444', marginLeft: '8px'}}>
                    {selectedOrder.paymentReceived ? 'Paid' : 'Unpaid'}
                  </span>
                </p>
              </div>
              
              <div style={styles.orderSection}>
                <h3>Order Items</h3>
                <div style={styles.itemsList}>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} style={styles.orderItem}>
                      <div style={styles.itemDetails}>
                        <strong>{item.name}</strong>
                        <p>Product ID: {item.productId}</p>
                      </div>
                      <div style={styles.itemQuantity}>
                        Qty: {item.quantity}
                      </div>
                      <div style={styles.itemPrice}>
                        ${item.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={styles.orderTotal}>
                  <strong>
                    Total: ${selectedOrder.items?.reduce((total, item) => 
                      total + (item.quantity * (item.price || 0)), 0
                    ).toFixed(2) || '0.00'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order View */}
        {currentView === 'edit-order' && editingOrder && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Edit Order</h1>
              <button 
                style={styles.secondaryButton}
                onClick={() => {setEditingOrder(null); setCurrentView('orders');}}
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={updateOrder} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Customer Name</label>
                <input
                  type="text"
                  value={editingOrder.customerName}
                  onChange={(e) => setEditingOrder(prev => ({...prev, customerName: e.target.value}))}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Order Items</label>
                {editingOrder.items?.map((item, index) => (
                  <div key={index} style={styles.itemRow}>
                    <input
                      type="text"
                      placeholder="Product ID"
                      value={item.productId}
                      onChange={(e) => updateEditOrderItem(index, 'productId', e.target.value)}
                      style={styles.input}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.name}
                      onChange={(e) => updateEditOrderItem(index, 'name', e.target.value)}
                      style={styles.input}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateEditOrderItem(index, 'quantity', parseInt(e.target.value))}
                      style={styles.input}
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateEditOrderItem(index, 'price', parseFloat(e.target.value))}
                      style={styles.input}
                      min="0"
                      step="0.01"
                      required
                    />
                    {editingOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditOrderItem(index)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditOrderItem}
                  style={styles.addButton}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editingOrder.paymentReceived}
                    onChange={(e) => setEditingOrder(prev => ({...prev, paymentReceived: e.target.checked}))}
                    style={styles.checkbox}
                  />
                  Payment Received
                </label>
              </div>
              
              <button type="submit" style={styles.primaryButton} disabled={loading}>
                <Save size={18} />
                {loading ? 'Updating Order...' : 'Update Order'}
              </button>
            </form>
          </div>
        )}

        {/* Create Order View */}
        {currentView === 'create-order' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Create New Order</h1>
              <button 
                style={styles.secondaryButton}
                onClick={() => setCurrentView('orders')}
              >
                Back to Orders
              </button>
            </div>
            
            <form onSubmit={createOrder} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Customer Name</label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm(prev => ({...prev, customerName: e.target.value}))}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Order Items</label>
                {orderForm.items.map((item, index) => (
                  <div key={index} style={styles.itemRow}>
                    <input
                      type="text"
                      placeholder="Product ID"
                      value={item.productId}
                      onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                      style={styles.input}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.name}
                      onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                      style={styles.input}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                      style={styles.input}
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value))}
                      style={styles.input}
                      min="0"
                      step="0.01"
                      required
                    />
                    {orderForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOrderItem}
                  style={styles.addButton}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={orderForm.paymentReceived}
                    onChange={(e) => setOrderForm(prev => ({...prev, paymentReceived: e.target.checked}))}
                    style={styles.checkbox}
                  />
                  Payment Received
                </label>
              </div>
              
              <button type="submit" style={styles.primaryButton} disabled={loading}>
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </form>
          </div>
        )}

        {/* Inventory View */}
        {currentView === 'inventory' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Inventory</h1>
              <button 
                style={styles.primaryButton}
                onClick={() => setCurrentView('add-inventory')}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
            
            {loading ? (
              <div style={styles.loading}>Loading inventory...</div>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span>Product ID</span>
                  <span>Name</span>
                  <span>Quantity</span>
                  <span>Reserved</span>
                  <span>Available</span>
                  <span>Actions</span>
                </div>
                {inventory.map(item => (
                  <div key={item._id} style={styles.tableRow}>
                    <span>{item.productId}</span>
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                    <span>{item.reserved || 0}</span>
                    <span style={{color: (item.quantity - (item.reserved || 0)) < 10 ? '#ef4444' : '#10b981'}}>
                      {item.quantity - (item.reserved || 0)}
                    </span>
                    <div style={styles.actionButtons}>
                      <button style={styles.iconButton} title="Edit Item">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Inventory View */}
        {currentView === 'add-inventory' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Add Inventory Item</h1>
              <button 
                style={styles.secondaryButton}
                onClick={() => setCurrentView('inventory')}
              >
                Back to Inventory
              </button>
            </div>
            
            <form onSubmit={addInventoryItem} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product ID</label>
                <input
                  type="text"
                  value={inventoryForm.productId}
                  onChange={(e) => setInventoryForm(prev => ({...prev, productId: e.target.value}))}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name</label>
                <input
                  type="text"
                  value={inventoryForm.name}
                  onChange={(e) => setInventoryForm(prev => ({...prev, name: e.target.value}))}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity</label>
                <input
                  type="number"
                  value={inventoryForm.quantity}
                  onChange={(e) => setInventoryForm(prev => ({...prev, quantity: parseInt(e.target.value)}))}
                  style={styles.input}
                  min="0"
                  required
                />
              </div>
              
              <button type="submit" style={styles.primaryButton} disabled={loading}>
                {loading ? 'Adding Item...' : 'Add Item'}
              </button>
            </form>
          </div>
        )}

        {/* Users View (Admin only) */}
        {currentView === 'users' && currentUser?.role === 'admin' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>User Management</h1>
            </div>
            
            {loading ? (
              <div style={styles.loading}>Loading users...</div>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span>Username</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Created</span>
                  <span>Actions</span>
                </div>
                {users.map(user => (
                  <div key={user._id} style={styles.tableRow}>
                    <span>{user.username}</span>
                    <span>{user.email}</span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: user.role === 'admin' ? '#8b5cf6' : user.role === 'staff' ? '#3b82f6' : '#6b7280'
                    }}>
                      {user.role}
                    </span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: user.isActive ? '#10b981' : '#ef4444'
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    <div style={styles.actionButtons}>
                      <button style={styles.iconButton} title="Edit User">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile View */}
        {currentView === 'profile' && (
          <div style={styles.content}>
            <div style={styles.contentHeader}>
              <h1>Profile</h1>
            </div>
            
            <div style={styles.profileCard}>
              <div style={styles.profileHeader}>
                <div style={styles.profileAvatar}>
                  <User size={48} />
                </div>
                <div style={styles.profileInfo}>
                  <h2>{currentUser?.username}</h2>
                  <p>{currentUser?.email}</p>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: currentUser?.role === 'admin' ? '#8b5cf6' : currentUser?.role === 'staff' ? '#3b82f6' : '#6b7280'
                  }}>
                    {currentUser?.role}
                  </span>
                </div>
              </div>
              
              <div style={styles.profileDetails}>
                <div style={styles.detailItem}>
                  <strong>Member Since:</strong>
                  <span>{new Date(currentUser?.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div style={styles.detailItem}>
                  <strong>Last Login:</strong>
                  <span>{currentUser?.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div style={styles.detailItem}>
                  <strong>Account Status:</strong>
                  <span style={{color: '#10b981'}}>Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Styles
const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  // Auth Styles
  authContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  
  authBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '400px'
  },
  
  authHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  authButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#5a67d8'
    }
  },
  
  authSwitch: {
    textAlign: 'center',
    margin: '10px 0 0 0',
    color: '#6b7280'
  },
  
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    textDecoration: 'underline',
    cursor: 'pointer',
    marginLeft: '5px'
  },
  
  // Navigation Styles
  nav: {
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: '700'
  },
  
  navMenu: {
    display: 'flex',
    gap: '8px'
  },
  
  navButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  
  navButtonActive: {
    backgroundColor: '#374151'
  },
  
  navUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  userName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  
  logoutButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px'
  },
  
  // Main Content Styles
  main: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px'
  },
  
  // Dashboard Styles
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  
  statIcon: {
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    padding: '12px',
    color: '#6b7280'
  },
  
  statContent: {
    flex: 1
  },
  
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '4px 0 0 0'
  },
  
  recentOrders: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  
  // Order Details Styles
  orderDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  
  orderInfo: {
    flex: 1
  },
  
  orderDate: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '4px 0 0 0'
  },
  
  orderSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px'
  },
  
  orderItem: {
    display: 'grid',
    gridTemplateColumns: '2fr 120px 120px',
    gap: '16px',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  itemQuantity: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151'
  },
  
  itemPrice: {
    textAlign: 'right',
    fontWeight: '600',
    color: '#059669',
    fontSize: '16px'
  },
  
  orderTotal: {
    textAlign: 'right',
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    border: '1px solid #0ea5e9',
    fontSize: '18px',
    color: '#0c4a6e'
  },
  
  // Form Styles
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '600px'
  },
  
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  
  input: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea'
    }
  },
  
  itemRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 100px 120px auto',
    gap: '12px',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    alignSelf: 'flex-start'
  },
  
  removeButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  
  checkbox: {
    width: '18px',
    height: '18px'
  },
  
  // Button Styles
  primaryButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  },
  
  secondaryButton: {
    backgroundColor: '#f9fafb',            
    color: '#1f2937',                      
    border: '1px solid #d1d5db',           
    borderRadius: '10px',                  
    padding: '12px 24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',                      
    fontWeight: '600',                     
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', 
    transition: 'all 0.25s ease',         
    outline: 'none',
  },
  
  iconButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s'
  },
  
  // Filter Styles
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #e5e7eb'
  },
  
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '14px',
    minWidth: '200px'
  },
  
  filterSelect: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  
  // Table Styles
  table: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    backgroundColor: '#f9fafb',
    padding: '16px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  },
  
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    padding: '16px',
    fontSize: '14px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
    ':hover': {
      backgroundColor: '#f9fafb'
    }
  },
  
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    maxWidth: 'fit-content'
  },
  
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  
  // Profile Styles
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  
  profileAvatar: {
    backgroundColor: '#f3f4f6',
    borderRadius: '50%',
    padding: '20px',
    color: '#6b7280'
  },
  
  profileInfo: {
    flex: 1
  },
  
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  
  // Notification Styles
  notificationContainer: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  notification: {
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '300px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    animation: 'slideIn 0.3s ease-out'
  },
  
  // Loading Styles
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280'
  }
};

export default OrderManagementSystem;