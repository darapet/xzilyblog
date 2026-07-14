import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { Post, User, Category } from "@/data/seed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ArticleCardProps {
  post: Post;
  author?: User;
  category?: Category;
  variant?: 'featured' | 'default' | 'compact';
}

export function ArticleCard({ post, author, category, variant = 'default' }: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <Link href={`/article/${post.slug}`} className="group block h-full">
        <article className="relative h-full min-h-[500px] md:min-h-[600px] overflow-hidden rounded-xl bg-muted">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col justify-end">
            {category && (
              <span className="inline-block bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm w-fit mb-4">
                {category.name}
              </span>
            )}
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-primary/90 transition-colors">
              {post.title}
            </h2>
            <p className="text-white/80 text-lg md:text-xl line-clamp-2 mb-6 max-w-3xl">
              {post.excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-white/90">
              {author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={author.avatar} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{author.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>&bull;</span>
                <time>{formatDate(post.createdAt)}</time>
                <span>&bull;</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/article/${post.slug}`} className="group flex gap-4 md:gap-6 items-start">
        <div className="relative aspect-video w-32 md:w-48 shrink-0 overflow-hidden rounded-lg">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col flex-1 py-1">
          {category && (
            <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2 block">
              {category.name}
            </span>
          )}
          <h3 className="font-serif text-lg md:text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
            {author && <span className="font-medium text-foreground">{author.name}</span>}
            <span>&bull;</span>
            <time>{formatDate(post.createdAt)}</time>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/article/${post.slug}`} className="group flex flex-col h-full">
      <article className="flex flex-col h-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl mb-4">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        <div className="flex flex-col flex-1">
          {category && (
            <span className="text-primary text-xs font-bold uppercase tracking-wider mb-3">
              {category.name}
            </span>
          )}
          <h3 className="font-serif text-2xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
            {author ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{author.name}</span>
                  <time className="text-xs text-muted-foreground mt-1">{formatDate(post.createdAt)}</time>
                </div>
              </div>
            ) : (
              <time className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</time>
            )}
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">
              {post.readingTime} min
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
