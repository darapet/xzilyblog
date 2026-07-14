import { Link } from "wouter";
import { format } from "date-fns";
import { Clock, ArrowRight, ArrowUpRight } from "lucide-react";
import { PostSummary } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: PostSummary;
  featured?: boolean;
  index?: number;
}

export function PostCard({ post, featured = false, index = 0 }: PostCardProps) {
  const isLarge = featured && index === 0;

  return (
    <div 
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-transparent bg-card transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5",
        isLarge ? "md:flex-row md:items-center md:gap-8 bg-transparent hover:bg-card" : "h-full"
      )}
    >
      {post.coverImageUrl && (
        <div 
          className={cn(
            "overflow-hidden rounded-xl bg-muted relative aspect-[16/10]",
            isLarge ? "md:w-3/5 md:aspect-video" : "w-full"
          )}
        >
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      )}

      <div className={cn("flex flex-1 flex-col", isLarge ? "md:w-2/5 md:py-8" : "p-4 pt-2")}>
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium">
            {post.category}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <span className="w-1 h-1 rounded-full bg-border" />
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), "MMM d, yyyy")}
            </time>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readingMinutes} min read
            </span>
          </div>
        </div>

        <h3 
          className={cn(
            "font-serif font-bold tracking-tight text-foreground transition-colors group-hover:text-primary mb-3",
            isLarge ? "text-3xl md:text-4xl lg:text-5xl leading-tight" : "text-xl leading-snug line-clamp-2"
          )}
        >
          <Link href={`/posts/${post.slug}`} className="before:absolute before:inset-0 z-10">
            {post.title}
          </Link>
        </h3>

        <p className={cn(
          "text-muted-foreground",
          isLarge ? "text-lg mb-6 line-clamp-3 md:line-clamp-4" : "text-sm line-clamp-3 mb-4 flex-1"
        )}>
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          Read story <ArrowUpRight size={16} />
        </div>
      </div>
    </div>
  );
}

export function PostCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-2xl animate-pulse",
      featured ? "md:flex-row md:items-center md:gap-8" : "h-full"
    )}>
      <div className={cn(
        "rounded-xl bg-muted aspect-[16/10]",
        featured ? "md:w-3/5 md:aspect-video" : "w-full"
      )} />
      <div className={cn("flex flex-1 flex-col gap-3", featured ? "md:w-2/5" : "p-4 pt-2")}>
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-24 bg-muted rounded-full" />
        </div>
        <div className="h-7 md:h-10 w-full bg-muted rounded-md" />
        <div className="h-7 md:h-10 w-3/4 bg-muted rounded-md mb-2" />
        <div className="h-4 w-full bg-muted rounded-md" />
        <div className="h-4 w-full bg-muted rounded-md" />
        <div className="h-4 w-2/3 bg-muted rounded-md" />
      </div>
    </div>
  );
}
