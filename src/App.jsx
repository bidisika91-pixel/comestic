import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle, TrendingDown, Edit, Trash2, Eye, ShoppingCart, History, Minus, Lock, User, LogOut } from 'lucide-react';
import { auth, db } from './firebase_file';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockLevel, setSelectedStockLevel] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForSale, setSelectedProductForSale] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    stock: '',
    minStock: '',
    price: '',
    sku: '',
    description: ''
  });

  const [saleData, setSaleData] = useState({
    quantity: '',
    customerName: '',
    notes: ''
  });

  const categories = [...new Set(products.map(p => p.category))];

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        loadProducts();
        loadSales();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setProducts([]);
        setSales([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Charger les produits depuis Firestore
  const loadProducts = async () => {
    try {
      const snapshot = await db.collection('d_products').get();
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  // Charger les ventes depuis Firestore
  const loadSales = async () => {
    try {
      const snapshot = await db.collection('d_sales').orderBy('date', 'desc').get();
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    auth.signInWithEmailAndPassword(loginData.email, loginData.password)
      .then((userCredential) => {
        setLoginData({ email: '', password: '' });
        setLoading(false);
      })
      .catch((error) => {
        setLoginError('Email ou mot de passe incorrect');
        setLoading(false);
      });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setCurrentView('dashboard');
    });
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return 'critical';
    if (product.stock <= product.minStock) return 'warning';
    return 'normal';
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case 'critical': return 'Rupture';
      case 'warning': return 'Stock Faible';
      case 'normal': return 'Normal';
      default: return 'Normal';
    }
  };

  const criticalProducts = products.filter(p => p.stock === 0);
  const warningProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const normalProducts = products.filter(p => p.stock > p.minStock);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    const matchesStockLevel = selectedStockLevel === 'all' || 
                             (selectedStockLevel === 'critical' && product.stock === 0) ||
                             (selectedStockLevel === 'warning' && product.stock > 0 && product.stock <= product.minStock) ||
                             (selectedStockLevel === 'normal' && product.stock > product.minStock);

    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        price: parseFloat(formData.price),
        userId: user.uid,
        updatedAt: new Date()
      };

      if (editingProduct) {
        await db.collection('d_products').doc(editingProduct.id).update(productData);
      } else {
        productData.createdAt = new Date();
        await db.collection('d_products').add(productData);
      }
      
      loadProducts();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await db.collection('d_products').doc(id).delete();
        loadProducts();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du produit');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      stock: '',
      minStock: '',
      price: '',
      sku: '',
      description: ''
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleSale = (product) => {
    setSelectedProductForSale(product);
    setSaleData({
      quantity: '',
      customerName: '',
      notes: ''
    });
    setShowSaleModal(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    
    const quantity = parseInt(saleData.quantity);
    
    if (quantity > selectedProductForSale.stock) {
      alert(`Stock insuffisant ! Stock disponible: ${selectedProductForSale.stock}`);
      return;
    }

    try {
      // Créer l'enregistrement de vente
      const saleRecord = {
        productId: selectedProductForSale.id,
        productName: selectedProductForSale.name,
        productSku: selectedProductForSale.sku,
        quantity: quantity,
        unitPrice: selectedProductForSale.price,
        totalPrice: quantity * selectedProductForSale.price,
        customerName: saleData.customerName,
        notes: saleData.notes,
        date: new Date(),
        userId: user.uid
      };

      // Ajouter la vente à Firestore
      await db.collection('d_sales').add(saleRecord);

      // Mettre à jour le stock du produit
      const newStock = selectedProductForSale.stock - quantity;
      await db.collection('d_products').doc(selectedProductForSale.id).update({
        stock: newStock,
        updatedAt: new Date()
      });

      // Recharger les données
      loadProducts();
      loadSales();

      // Réinitialiser le formulaire
      resetSaleForm();
    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      alert('Erreur lors de l\'enregistrement de la vente');
    }
  };

  const resetSaleForm = () => {
    setShowSaleModal(false);
    setSelectedProductForSale(null);
    setSaleData({
      quantity: '',
      customerName: '',
      notes: ''
    });
  };

  // Affichage du loading
  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <Package size={32} />
            </div>
            <h1>CosmeStock</h1>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher le formulaire de login
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <Package size={32} />
            </div>
            <h1>CosmeStock</h1>
            <p>Gestion de Stock Cosmétique</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>
                <User size={18} />
                Email
              </label>
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                placeholder="Entrez votre email"
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Entrez votre mot de passe"
              />
            </div>

            {loginError && (
              <div className="login-error">
                <AlertTriangle size={16} />
                {loginError}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <Package className="header-icon" />
            <h1>CosmeStock</h1>
          </div>
          <div className="header-right">
            <nav className="nav">
              <button 
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Tableau de Bord
              </button>
              <button 
                className={`nav-btn ${currentView === 'products' ? 'active' : ''}`}
                onClick={() => setCurrentView('products')}
              >
                Produits
              </button>
              <button 
                className={`nav-btn ${currentView === 'sales' ? 'active' : ''}`}
                onClick={() => setCurrentView('sales')}
              >
                Ventes
              </button>
            </nav>
            <button className="logout-btn" onClick={handleLogout} title="Se déconnecter">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {currentView === 'dashboard' && (
          <div className="dashboard">
            <div className="dashboard-header">
              <h2>Tableau de Bord</h2>
              <p>Vue d'ensemble de votre stock cosmétique</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Package />
                </div>
                <div className="stat-content">
                  <h3>{products.length}</h3>
                  <p>Produits Total</p>
                </div>
              </div>

              <div className="stat-card critical">
                <div className="stat-icon">
                  <AlertTriangle />
                </div>
                <div className="stat-content">
                  <h3>{criticalProducts.length}</h3>
                  <p>Ruptures de Stock</p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <TrendingDown />
                </div>
                <div className="stat-content">
                  <h3>{warningProducts.length}</h3>
                  <p>Stock Faible</p>
                </div>
              </div>

              <div className="stat-card normal">
                <div className="stat-icon">
                  <Package />
                </div>
                <div className="stat-content">
                  <h3>{normalProducts.length}</h3>
                  <p>Stock Normal</p>
                </div>
              </div>
            </div>

            {criticalProducts.length > 0 && (
              <div className="alert-section">
                <h3 className="alert-title critical">
                  <AlertTriangle size={20} />
                  Produits en Rupture de Stock
                </h3>
                <div className="product-grid">
                  {criticalProducts.map(product => (
                    <div key={product.id} className="product-card critical">
                      <div className="product-header">
                        <h4>{product.name}</h4>
                        <span className="stock-badge critical">Rupture</span>
                      </div>
                      <p className="product-brand">{product.brand}</p>
                      <div className="product-details">
                        <span>SKU: {product.sku}</span>
                        <span>{product.price}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {warningProducts.length > 0 && (
              <div className="alert-section">
                <h3 className="alert-title warning">
                  <TrendingDown size={20} />
                  Produits à Stock Faible
                </h3>
                <div className="product-grid">
                  {warningProducts.map(product => (
                    <div key={product.id} className="product-card warning">
                      <div className="product-header">
                        <h4>{product.name}</h4>
                        <span className="stock-badge warning">{product.stock} restants</span>
                      </div>
                      <p className="product-brand">{product.brand}</p>
                      <div className="product-details">
                        <span>SKU: {product.sku}</span>
                        <span>{product.price}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'products' && (
          <div className="products-section">
            <div className="products-header">
              <h2>Gestion des Produits</h2>
              <button 
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={20} />
                Nouveau Produit
              </button>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                value={selectedStockLevel} 
                onChange={(e) => setSelectedStockLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les niveaux</option>
                <option value="critical">Rupture</option>
                <option value="warning">Stock faible</option>
                <option value="normal">Stock normal</option>
              </select>
            </div>

            <div className="products-table">
              <div className="table-header">
                <div>Produit</div>
                <div>Catégorie</div>
                <div>Stock</div>
                <div>Prix</div>
                <div>Actions</div>
              </div>

              {filteredProducts.map(product => {
                const status = getStockStatus(product);
                return (
                  <div key={product.id} className={`table-row ${status}`}>
                    <div className="product-info">
                      <div>
                        <strong>{product.name}</strong>
                        <span className="product-brand">{product.brand}</span>
                      </div>
                      <span className="product-sku">SKU: {product.sku}</span>
                    </div>
                    <div>{product.category}</div>
                    <div className="stock-info">
                      <span className={`stock-badge ${status}`}>
                        {product.stock}
                      </span>
                      <span className="stock-status">{getStockStatusText(status)}</span>
                    </div>
                    <div className="price">{product.price}€</div>
                    <div className="actions">
                      <button 
                        className="btn-icon sale"
                        onClick={() => handleSale(product)}
                        title="Vendre"
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => handleEdit(product)}
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDelete(product.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'sales' && (
          <div className="sales-section">
            <div className="sales-header">
              <h2>Historique des Ventes</h2>
              <div className="sales-stats">
                <div className="sales-stat">
                  <span className="stat-number">{sales.length}</span>
                  <span className="stat-label">Ventes Total</span>
                </div>
                <div className="sales-stat">
                  <span className="stat-number">
                    {sales.reduce((sum, sale) => sum + sale.totalPrice, 0).toFixed(2)}€
                  </span>
                  <span className="stat-label">Chiffre d'Affaires</span>
                </div>
              </div>
            </div>

            {sales.length === 0 ? (
              <div className="empty-state">
                <History size={48} />
                <h3>Aucune vente enregistrée</h3>
                <p>Les ventes apparaîtront ici une fois que vous aurez commencé à vendre des produits.</p>
              </div>
            ) : (
              <div className="sales-table">
                <div className="table-header">
                  <div>Date</div>
                  <div>Produit</div>
                  <div>Client</div>
                  <div>Quantité</div>
                  <div>Total</div>
                </div>

                {sales.map(sale => (
                  <div key={sale.id} className="table-row">
                    <div className="sale-date">
                      {sale.date && sale.date.toDate ? sale.date.toDate().toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date inconnue'}
                    </div>
                    <div className="product-info">
                      <div>
                        <strong>{sale.productName}</strong>
                        <span className="product-sku">SKU: {sale.productSku}</span>
                      </div>
                    </div>
                    <div>{sale.customerName || 'Client anonyme'}</div>
                    <div className="quantity">{sale.quantity}</div>
                    <div className="price">{sale.totalPrice.toFixed(2)}€</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => resetForm()}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}</h3>
                <button className="btn-close" onClick={() => resetForm()}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom du produit *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marque *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="ex: Maquillage, Soins..."
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stock actuel *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock d'alerte *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prix (€) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => resetForm()}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProduct ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSaleModal && selectedProductForSale && (
          <div className="modal-overlay" onClick={() => resetSaleForm()}>
            <div className="modal sale-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Vendre - {selectedProductForSale.name}</h3>
                <button className="btn-close" onClick={() => resetSaleForm()}>×</button>
              </div>

              <div className="product-summary">
                <div className="product-info">
                  <h4>{selectedProductForSale.name}</h4>
                  <p>{selectedProductForSale.brand} - {selectedProductForSale.sku}</p>
                </div>
                <div className="stock-info">
                  <span className="stock-available">Stock disponible: {selectedProductForSale.stock}</span>
                  <span className="unit-price">Prix unitaire: {selectedProductForSale.price}€</span>
                </div>
              </div>

              <form onSubmit={handleSaleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantité à vendre *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedProductForSale.stock}
                      value={saleData.quantity}
                      onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom du client</label>
                    <input
                      type="text"
                      value={saleData.customerName}
                      onChange={(e) => setSaleData({...saleData, customerName: e.target.value})}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
                    rows="2"
                    placeholder="Notes sur la vente (optionnel)"
                  />
                </div>

                {saleData.quantity && (
                  <div className="sale-summary">
                    <div className="summary-row">
                      <span>Quantité:</span>
                      <span>{saleData.quantity}</span>
                    </div>
                    <div className="summary-row">
                      <span>Prix unitaire:</span>
                      <span>{selectedProductForSale.price}€</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>{(saleData.quantity * selectedProductForSale.price).toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => resetSaleForm()}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    <ShoppingCart size={16} />
                    Confirmer la Vente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;