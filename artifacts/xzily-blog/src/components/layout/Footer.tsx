import { Link } from "wouter";
import { SiX, SiFacebook, SiLinkedin, SiInstagram } from "react-icons/si";

export function Footer() {
  return (
    <footer className="border-t bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-3xl font-black tracking-tighter text-primary">XZILY</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
              A bold editorial platform for sharp, fast-moving thinkers. Unapologetic design, uncompromising ideas.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <SiX className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <SiInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <SiLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-3">
              <li><Link href="/category/technology" className="text-sm text-muted-foreground hover:text-primary transition-colors">Technology</Link></li>
              <li><Link href="/category/business" className="text-sm text-muted-foreground hover:text-primary transition-colors">Business</Link></li>
              <li><Link href="/category/lifestyle" className="text-sm text-muted-foreground hover:text-primary transition-colors">Lifestyle</Link></li>
              <li><Link href="/category/culture" className="text-sm text-muted-foreground hover:text-primary transition-colors">Culture</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The sharpest ideas delivered to your inbox weekly.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <button 
                type="button" 
                className="h-10 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Xzily Publishing. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/admin/login" className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
              Editor Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
