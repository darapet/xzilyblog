import { Route, Switch, Router as WouterRouter } from 'wouter';
import { StoreProvider } from './store';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

import { Home } from './pages/Home';
import { ArticlePage } from './pages/Article';
import { CategoryPage } from './pages/Category';
import { SearchPage } from './pages/Search';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminCreatePost } from './pages/admin/CreatePost';
import { AdminLogin } from './pages/admin/Login';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-serif text-8xl font-black text-muted-foreground/20 mb-4">404</h1>
      <h2 className="font-serif text-3xl font-bold mb-4">Page not found</h2>
      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Return home
      </a>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminDashboard />
      </Route>
      <Route path="/admin/posts/create">
        <AdminCreatePost />
      </Route>
      <Route path="/admin/:rest*">
        <AdminDashboard /> {/* Fallback admin catchall for demo */}
      </Route>

      <Route>
        <PublicLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/article/:slug" component={ArticlePage} />
            <Route path="/category/:slug" component={CategoryPage} />
            <Route path="/search" component={SearchPage} />
            {/* Mock routes for legal/about pages to avoid 404s */}
            <Route path="/about" component={() => <div className="p-20 text-center font-serif text-2xl font-bold">About Xzily</div>} />
            <Route path="/contact" component={() => <div className="p-20 text-center font-serif text-2xl font-bold">Contact Us</div>} />
            <Route path="/login" component={() => <div className="p-20 text-center font-serif text-2xl font-bold">Reader Login (Mock)</div>} />
            <Route path="/register" component={() => <div className="p-20 text-center font-serif text-2xl font-bold">Reader Register (Mock)</div>} />
            <Route component={NotFound} />
          </Switch>
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <StoreProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRouter />
      </WouterRouter>
    </StoreProvider>
  );
}

export default App;
