import { useListPosts, useListFeaturedPosts } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [location] = useLocation();

  // Handle query params for category filtering (if navigated from categories page)
  const queryParams = new URLSearchParams(window.location.search);
  const categoryFilter = queryParams.get("category") || undefined;

  // Manual debounce for search
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: featuredPosts, isLoading: isLoadingFeatured } = useListFeaturedPosts();
  const { data: posts, isLoading: isLoadingPosts } = useListPosts(
    { search: debouncedSearch, category: categoryFilter },
    { query: { enabled: true } }
  );

  const heroPost = featuredPosts?.[0];
  const secondaryFeatured = featuredPosts?.slice(1, 3) || [];

  return (
    <Shell>
      {/* Featured Section - Only show if not filtering/searching */}
      {!categoryFilter && !debouncedSearch && (
        <section className="container mx-auto px-4 md:px-6 pt-8 pb-16">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Stories from the margins of everyday life.
            </h1>
            <p className="text-lg text-muted-foreground">
              A collection of thoughts, observations, and ideas worth writing down.
            </p>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12">
                <PostCardSkeleton featured />
              </div>
            </div>
          ) : heroPost ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12 mb-6">
                <PostCard post={heroPost} featured index={0} />
              </div>
              {secondaryFeatured.map((post, i) => (
                <div key={post.id} className="md:col-span-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${(i+1)*150}ms` }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Latest Posts Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 border-t border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">
              {categoryFilter ? `Topic: ${categoryFilter}` : debouncedSearch ? "Search Results" : "Latest Entries"}
            </h2>
            {(categoryFilter || debouncedSearch) && (
              <Button variant="link" className="px-0 h-auto text-primary" onClick={() => {
                window.history.replaceState({}, '', '/');
                setSearch("");
                setDebouncedSearch("");
              }}>
                Clear filters
              </Button>
            )}
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              type="search" 
              placeholder="Search journals..." 
              className="pl-9 bg-card border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoadingPosts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-3xl border border-border/50 border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">No posts found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any entries matching your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post, i) => (
              <div 
                key={post.id} 
                className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
