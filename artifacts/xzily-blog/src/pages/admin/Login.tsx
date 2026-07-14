import { useStore } from "@/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Lock } from "lucide-react";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { adminSeedLogin, state } = useStore();
  const [location, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, any input works and triggers the seed login
    adminSeedLogin();
    setLocation('/admin');
  };

  // If already logged in as admin
  if (state.currentUser?.role === 'admin') {
    setLocation('/admin');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="font-serif text-4xl font-black tracking-tighter text-white">XZILY</span>
          </Link>
          <p className="text-zinc-400 mt-2 font-medium tracking-wide uppercase text-sm">Editor Portal</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
              <Input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-primary h-12" 
                placeholder="editor@xzily.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <Input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-primary h-12" 
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold bg-primary text-white hover:bg-primary/90">
              <Lock className="w-4 h-4 mr-2" /> Authenticate
            </Button>
            
            <p className="text-center text-xs text-zinc-500 pt-4">
              Demo bypass: Enter any credentials to login as Admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
