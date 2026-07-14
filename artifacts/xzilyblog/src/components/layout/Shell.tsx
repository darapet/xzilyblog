import { Link, useLocation } from "wouter";
import { PenTool, Coffee, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Journal" },
    { href: "/categories", label: "Topics" },
    { href: "/admin", label: "Write" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-3"
            : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 z-50">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg transform transition-transform group-hover:-rotate-6 group-hover:scale-110">
              <Coffee size={20} strokeWidth={2.5} />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Xzily
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative py-1",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
                {location === link.href && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-left-2" />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 -mr-2 text-foreground z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "text-2xl font-serif font-medium transition-colors",
                location === link.href ? "text-primary" : "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="w-full border-t border-border mt-24 py-12 bg-card">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 opacity-80">
            <Coffee size={18} className="text-primary" />
            <span className="font-serif font-semibold text-lg">Xzily</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Thoughts, stories and ideas. &copy; {new Date().getFullYear()} Xzily.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <PenTool size={14} /> Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
