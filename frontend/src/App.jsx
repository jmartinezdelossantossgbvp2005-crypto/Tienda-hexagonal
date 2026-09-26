import { useState } from 'react';
import { AuthProvider } from './modules/auth/AuthContext.jsx';
import { useAuth } from './modules/auth/useAuth.js';
import { AuthModal } from './modules/auth/AuthModal.jsx';
import { ProductList } from './modules/products/ProductList.jsx';
import { OrderList } from './modules/orders/OrderList.jsx';
import { CartDrawer } from './modules/orders/CartDrawer.jsx';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const { user, logout, isAdmin } = useAuth();

  const handleAddToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('No hay más unidades disponibles de este producto.');
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
      );
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand" onClick={() => setActiveTab('products')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <span>Tienda</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            {isAdmin ? 'Gestión Pedidos' : 'Mis Pedidos'}
          </button>
        </nav>

        <div className="header-actions">
          {!isAdmin && (
            <button className="btn btn-outline" onClick={() => setIsCartOpen(true)}>
              🛒 Carrito ({totalCartCount})
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-info'}`}>
                  {user.role}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={logout}>
                Salir
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsAuthOpen(true)}>
              Ingresar / Registro
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'products' && (
          <ProductList onAddToCart={handleAddToCart} />
        )}
        {activeTab === 'orders' && (
          <OrderList />
        )}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCartItems([])}
        onOrderCreated={() => {
          setActiveTab('orders');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
