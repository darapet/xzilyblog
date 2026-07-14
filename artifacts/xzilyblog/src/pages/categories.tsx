import { useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Folder, Hash, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Explore Topics</h1>
          <p className="text-lg text-muted-foreground">
            Browse through different collections of thoughts and stories.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-serif font-bold mb-2">No categories found</h3>
            <p className="text-muted-foreground">Topics will appear here once posts are published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.map((cat, i) => (
              <Link 
                key={cat.name} 
                href={`/?category=${encodeURIComponent(cat.name)}`}
                className="group relative flex flex-col justify-between h-40 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Hash size={20} />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-foreground">{cat.name}</h2>
                </div>
                
                <div className="flex items-end justify-between mt-auto">
                  <div className="text-sm font-medium text-muted-foreground">
                    {cat.postCount} {cat.postCount === 1 ? 'story' : 'stories'}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
