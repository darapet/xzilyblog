import { useStore } from "@/store";
import { ArticleCard } from "@/components/ArticleCard";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function Home() {
  const { state } = useStore();
  
  // Ensure we only show published posts for the public site
  const publishedPosts = state.posts.filter(p => p.status === 'published');
  
  const featuredPost = publishedPosts.find(p => p.featured) || publishedPosts[0];
  const latestPosts = publishedPosts.filter(p => p.id !== featuredPost?.id).slice(0, 6);
  const popularPosts = publishedPosts.filter(p => p.popular).slice(0, 4);

  const getAuthor = (id: string) => state.users.find(u => u.id === id);
  const getCategory = (id: string) => state.categories.find(c => c.id === id);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">
        {/* Featured Section */}
        {featuredPost && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <ArticleCard 
                post={featuredPost}
                author={getAuthor(featuredPost.authorId)}
                category={getCategory(featuredPost.categoryId)}
                variant="featured"
              />
            </motion.div>
          </section>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Latest Articles */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8 border-b pb-4">
                <h2 className="font-serif text-3xl font-bold">Latest Stories</h2>
                <Link href="/search" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {latestPosts.map(post => (
                  <motion.div key={post.id} variants={item}>
                    <ArticleCard 
                      post={post}
                      author={getAuthor(post.authorId)}
                      category={getCategory(post.categoryId)}
                      variant="default"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-12">
              
              {/* Popular section */}
              <div>
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                  <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse inline-block"></span>
                    Trending Now
                  </h2>
                </div>
                <div className="flex flex-col gap-6">
                  {popularPosts.map((post, i) => (
                    <div key={post.id} className="flex gap-4">
                      <span className="font-serif text-4xl font-black text-muted-foreground/30 leading-none pt-1">
                        {i + 1}
                      </span>
                      <ArticleCard 
                        post={post}
                        author={getAuthor(post.authorId)}
                        category={getCategory(post.categoryId)}
                        variant="compact"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-muted/50 p-6 rounded-xl border">
                <h3 className="font-serif text-xl font-bold mb-6">Explore Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {state.categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      href={`/category/${cat.slug}`}
                      className="bg-background border px-4 py-2 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter block */}
              <div className="bg-primary text-primary-foreground p-8 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3 relative z-10">The Sunday Brief</h3>
                <p className="text-primary-foreground/80 text-sm mb-6 relative z-10">
                  Join 45,000+ readers who receive our editor's picks every week.
                </p>
                <form className="relative z-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="email" 
                      placeholder="Your email address" 
                      className="w-full h-11 px-4 rounded border-none bg-white text-black placeholder:text-gray-500 focus:ring-2 focus:ring-black outline-none"
                    />
                    <button className="w-full h-11 bg-black text-white font-bold rounded hover:bg-black/80 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
