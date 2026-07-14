import { useStore } from "@/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Users, FileText, MessageSquare, TrendingUp, Search, Eye, ThumbsUp, LogOut } from "lucide-react";

export function AdminDashboard() {
  const { state, logout } = useStore();
  const [location, setLocation] = useLocation();

  if (!state.currentUser || state.currentUser.role !== 'admin') {
    setLocation('/admin/login');
    return null;
  }

  const publishedPosts = state.posts.filter(p => p.status === 'published');
  const draftPosts = state.posts.filter(p => p.status === 'draft');
  const totalViews = state.posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalLikes = state.posts.reduce((sum, post) => sum + (post.likes || 0), 0);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border shrink-0 md:h-screen sticky top-0 flex flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="font-serif text-2xl font-black text-primary block">XZILY</Link>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 block">Editor Portal</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary font-medium rounded-md">
            <TrendingUp className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/admin/posts/create" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground font-medium rounded-md transition-colors">
            <FileText className="h-5 w-5" /> Write Post
          </Link>
          <Link href="/admin/posts" className="flex items-center justify-between px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground font-medium rounded-md transition-colors">
            <div className="flex items-center gap-3"><FileText className="h-5 w-5" /> All Posts</div>
            <span className="bg-muted-foreground/20 text-xs px-2 py-0.5 rounded-full">{state.posts.length}</span>
          </Link>
          <Link href="/admin/comments" className="flex items-center justify-between px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground font-medium rounded-md transition-colors">
            <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5" /> Comments</div>
            <span className="bg-muted-foreground/20 text-xs px-2 py-0.5 rounded-full">{state.comments.length}</span>
          </Link>
          <Link href="/admin/subscribers" className="flex items-center justify-between px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground font-medium rounded-md transition-colors">
            <div className="flex items-center gap-3"><Users className="h-5 w-5" /> Subscribers</div>
            <span className="bg-muted-foreground/20 text-xs px-2 py-0.5 rounded-full">{state.subscribers.length}</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <img src={state.currentUser.avatar} alt="" className="h-10 w-10 rounded-full border border-border" />
            <div className="overflow-hidden">
              <span className="block text-sm font-bold truncate">{state.currentUser.name}</span>
              <span className="block text-xs text-muted-foreground truncate">{state.currentUser.email}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold mb-2">Welcome back, {state.currentUser.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground">Here's what's happening with Xzily today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation('/')}>View Site</Button>
            <Button onClick={() => setLocation('/admin/posts/create')}>Write Post</Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Total Views</span>
                <h3 className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Eye className="h-6 w-6" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +12% this week
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Total Likes</span>
                <h3 className="text-3xl font-bold mt-1">{totalLikes.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ThumbsUp className="h-6 w-6" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +5% this week
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Published</span>
                <h3 className="text-3xl font-bold mt-1">{publishedPosts.length}</h3>
              </div>
              <div className="p-2 bg-muted rounded-lg text-foreground">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {draftPosts.length} drafts pending
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Subscribers</span>
                <h3 className="text-3xl font-bold mt-1">{state.subscribers.length + 45000}</h3>
              </div>
              <div className="p-2 bg-muted rounded-lg text-foreground">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +120 today
            </div>
          </div>
        </div>

        {/* Recent Posts Table */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-serif text-xl font-bold">Recent Articles</h2>
            <Link href="/admin/posts" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.posts.slice(0, 5).map(post => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={post.coverImage} className="h-10 w-16 object-cover rounded shadow-sm" alt="" />
                        <span className="font-medium max-w-sm truncate block">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {post.views?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link href={`/admin/posts/edit/${post.id}`} className="text-primary hover:text-primary/80 mr-4">Edit</Link>
                      <a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
