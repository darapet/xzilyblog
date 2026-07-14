import { useStore } from "@/store";
import { Link, useRoute } from "wouter";
import { ArticleCard } from "@/components/ArticleCard";
import { motion } from "framer-motion";

export function CategoryPage() {
  const [match, params] = useRoute("/category/:slug");
  const { state } = useStore();

  if (!match || !params?.slug) return null;

  const category = state.categories.find(c => c.slug === params.slug);
  
  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-4xl font-bold mb-4">Category not found</h1>
        <p className="text-muted-foreground mb-8">The category you are looking for does not exist.</p>
        <Link href="/" className="text-primary hover:underline font-medium">Return home</Link>
      </div>
    );
  }

  const posts = state.posts.filter(p => p.categoryId === category.id && p.status === 'published');
  
  const getAuthor = (id: string) => state.users.find(u => u.id === id);

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-muted py-16 md:py-24 mb-12 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-7xl font-black mb-6 text-primary"
          >
            {category.name}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-muted-foreground leading-relaxed"
          >
            {category.description}
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No articles found in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post, i) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ArticleCard 
                  post={post}
                  author={getAuthor(post.authorId)}
                  category={category}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
