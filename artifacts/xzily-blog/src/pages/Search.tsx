import { useStore } from "@/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";

export function SearchPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  
  const publishedPosts = state.posts.filter(p => p.status === 'published');
  
  const results = query.trim() ? publishedPosts.filter(post => 
    post.title.toLowerCase().includes(query.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
    post.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  ) : [];

  const getAuthor = (id: string) => state.users.find(u => u.id === id);
  const getCategory = (id: string) => state.categories.find(c => c.id === id);

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-foreground text-background py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl font-black mb-8 text-center">Search Xzily</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-background/50" />
            <input 
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, tag, or keyword..."
              className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/50 h-16 pl-14 pr-4 rounded-xl text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 max-w-6xl">
        {query.trim() && (
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold">
              {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
            </h2>
          </div>
        )}

        {!query.trim() ? (
          <div className="text-center py-20 text-muted-foreground">
            Enter a search term above to find articles.
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-serif text-2xl font-bold mb-4">No results found</h3>
            <p className="text-muted-foreground">We couldn't find anything matching your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {results.map(post => (
              <ArticleCard 
                key={post.id}
                post={post}
                author={getAuthor(post.authorId)}
                category={getCategory(post.categoryId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
