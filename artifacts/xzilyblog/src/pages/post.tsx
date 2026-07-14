import { useRoute, useLocation, Link } from "wouter";
import { useGetPost } from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { CommentSection } from "@/components/CommentSection";
import { format } from "date-fns";
import { Clock, Tag, ArrowLeft, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Post() {
  const [match, params] = useRoute("/posts/:slug");
  const slug = params?.slug;
  const [, setLocation] = useLocation();

  const { data: post, isLoading, isError } = useGetPost(slug || "", {
    query: { enabled: !!slug }
  });

  if (isError) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-8">This page may have been moved or deleted.</p>
          <Button onClick={() => setLocation("/")} size="lg">
            <ArrowLeft className="mr-2 w-4 h-4" /> Return Home
          </Button>
        </div>
      </Shell>
    );
  }

  if (isLoading || !post) {
    return (
      <Shell>
        <article className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
          <div className="mb-8">
            <Skeleton className="h-6 w-32 mb-4 rounded-full" />
            <Skeleton className="h-12 md:h-16 w-full mb-4" />
            <Skeleton className="h-12 md:h-16 w-3/4 mb-6" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="w-full aspect-[21/9] rounded-2xl mb-12" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </div>
        </article>
      </Shell>
    );
  }

  return (
    <Shell>
      <article className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-10 group">
          <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to journal
        </Link>

        <header className="mb-12 text-center">
          <Link href={`/?category=${post.category}`}>
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-sm rounded-full transition-colors cursor-pointer">
              {post.category}
            </Badge>
          </Link>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="font-medium text-foreground">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{post.readingMinutes} min read</span>
            </div>
          </div>
        </header>

        {post.coverImageUrl && (
          <figure className="mb-16 rounded-3xl overflow-hidden shadow-xl shadow-primary/5 border border-border/50">
            <img 
              src={post.coverImageUrl} 
              alt={post.title} 
              className="w-full h-auto max-h-[60vh] object-cover"
            />
          </figure>
        )}

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline mb-16">
          {/* We're doing a simple newline split to paragraph mapping since we don't have a markdown parser yet, 
              but in a real app we'd use react-markdown or similar */}
          {post.content.split('\n\n').map((paragraph, index) => (
            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
          ))}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-3 pt-6 border-t border-border mt-10">
            <Tag size={18} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal text-muted-foreground hover:bg-card cursor-default">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <CommentSection postSlug={post.slug} />
      </article>
    </Shell>
  );
}
