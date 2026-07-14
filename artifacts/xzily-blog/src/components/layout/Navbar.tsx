import { Link, useLocation } from "wouter";
import { useStore } from "@/store";
import { Search, UserCircle, LogOut, Settings, Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { state, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = state.currentUser?.role === 'admin';

  const navLinks = [
    { label: 'Technology', href: '/category/technology' },
    { label: 'Business', href: '/category/business' },
    { label: 'Lifestyle', href: '/category/lifestyle' },
    { label: 'Culture', href: '/category/culture' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-black tracking-tighter text-primary">XZILY</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/search')} aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
            
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{state.currentUser.name}</span>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setLocation('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setLocation('/login')}>Sign in</Button>
                <Button onClick={() => setLocation('/register')}>Subscribe</Button>
              </div>
            )}
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-base font-medium text-foreground py-2 border-b"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link 
              href="/search"
              className="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Search className="h-5 w-5" />
              Search
            </Link>
          </nav>
          
          <div className="flex flex-col gap-2 pt-4">
            {state.currentUser ? (
              <>
                <div className="flex items-center gap-2 px-2 py-3 border-b">
                  <UserCircle className="h-6 w-6" />
                  <span className="font-medium">{state.currentUser.name}</span>
                </div>
                {isAdmin && (
                  <Button variant="outline" className="justify-start w-full" onClick={() => {
                    setLocation('/admin');
                    setIsMobileMenuOpen(false);
                  }}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Button>
                )}
                <Button variant="ghost" className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => {
                  setLocation('/login');
                  setIsMobileMenuOpen(false);
                }}>Sign in</Button>
                <Button className="w-full" onClick={() => {
                  setLocation('/register');
                  setIsMobileMenuOpen(false);
                }}>Subscribe</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
