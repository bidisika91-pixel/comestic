import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle, TrendingDown, Edit, Trash2, Eye, ShoppingCart, History, Minus, Lock, User, LogOut } from 'lucide-react';
import './App.css';

// Données d'exemple
const initialProducts = [
  {
    id: 1,
    name: "Rouge à Lèvres Mat",
    category: "Maquillage",
    brand: "Glamour Pro",
    stock: 5,
    minStock: 10,
    price: 25.99,
    sku: "RAL001",
    description: "Rouge à lèvres longue tenue"
  },
  {
    id: 2,
    name: "Crème Hydratante Visage",
    category: "Soins",
    brand: "Beauty Care",
    stock: 2,
    minStock: 8,
    price: 45.50,
    sku: "CHV002",
    description: "Crème anti-âge pour tous types de peau"
  },
  {
    id: 3,
    name: "Mascara Volume",
    category: "Maquillage",
    brand: "Eye Perfect",
    stock: 15,
    minStock: 12,
    price: 18.90,
    sku: "MV003",
    description: "Mascara effet volume intense"
  },
  {
    id: 4,
    name: "Sérum Vitamine C",
    category: "Soins",
    brand: "Vitamin Plus",
    stock: 0,
    minStock: 5,
    price: 65.00,
    sku: "SVC004",
    description: "Sérum concentré en vitamine C"
  }
];

function App() {
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
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

  // Données de connexion (en production, cela devrait être géré côté serveur)
  const validCredentials = {
    username: 'admin',
    password: 'cosmestock2024'
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const savedAuth = localStorage.getItem('cosmestock_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginData.username === validCredentials.username && 
        loginData.password === validCredentials.password) {
      setIsAuthenticated(true);
      localStorage.setItem('cosmestock_auth', 'true');
      setLoginData({ username: '', password: '' });
    } else {
      setLoginError('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cosmestock_auth');
    setCurrentView('dashboard');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...formData, id: editingProduct.id, stock: parseInt(formData.stock), minStock: parseInt(formData.minStock), price: parseFloat(formData.price) }
          : p
      ));
    } else {
      const newProduct = {
        ...formData,
        id: Date.now(),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        price: parseFloat(formData.price)
      };
      setProducts([...products, newProduct]);
    }
    
    resetForm();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id));
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

  const handleSaleSubmit = (e) => {
    e.preventDefault();
    
    const quantity = parseInt(saleData.quantity);
    
    if (quantity > selectedProductForSale.stock) {
      alert(`Stock insuffisant ! Stock disponible: ${selectedProductForSale.stock}`);
      return;
    }

    // Créer l'enregistrement de vente
    const newSale = {
      id: Date.now(),
      productId: selectedProductForSale.id,
      productName: selectedProductForSale.name,
      productSku: selectedProductForSale.sku,
      quantity: quantity,
      unitPrice: selectedProductForSale.price,
      totalPrice: quantity * selectedProductForSale.price,
      customerName: saleData.customerName,
      notes: saleData.notes,
      date: new Date().toISOString()
    };

    // Mettre à jour le stock du produit
    setProducts(products.map(p => 
      p.id === selectedProductForSale.id 
        ? { ...p, stock: p.stock - quantity }
        : p
    ));

    // Ajouter la vente à l'historique
    setSales([newSale, ...sales]);

    // Réinitialiser le formulaire
    setShowSaleModal(false);
    setSelectedProductForSale(null);
    setSaleData({
      quantity: '',
      customerName: '',
      notes: ''
    });
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
                Nom d'utilisateur
              </label>
              <input
                type="text"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                placeholder="Entrez votre nom d'utilisateur"
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

            <button type="submit" className="login-btn">
              Se connecter
            </button>
          </form>

          <div className="login-demo">
            <p><strong>Compte de démonstration :</strong></p>
            <p>Utilisateur : <code>admin</code></p>
            <p>Mot de passe : <code>cosmestock2024</code></p>
          </div>
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
                      {new Date(sale.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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