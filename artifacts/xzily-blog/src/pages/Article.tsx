import { useStore } from "@/store";
import { Link, useRoute } from "wouter";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  MoreHorizontal,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon
} from "lucide-react";
import { SiWhatsapp, SiTelegram, SiX } from "react-icons/si";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ArticlePage() {
  const [match, params] = useRoute("/article/:slug");
  const { state, toggleLike, toggleBookmark, addComment, deleteComment } = useStore();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (!match || !params?.slug) return null;

  const post = state.posts.find(p => p.slug === params.slug);
  
  if (!post || post.status !== 'published') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-4xl font-bold mb-4">Article not found</h1>
        <p className="text-muted-foreground mb-8">This article may have been removed or never existed.</p>
        <Link href="/" className="text-primary hover:underline font-medium">Return home</Link>
      </div>
    );
  }

  const author = state.users.find(u => u.id === post.authorId);
  const category = state.categories.find(c => c.id === post.categoryId);
  const postComments = state.comments.filter(c => c.postId === post.id);
  
  const isLiked = state.likes[post.id] || false;
  const isBookmarked = state.bookmarks[post.id] || false;

  const handleShare = (platform: string) => {
    // Mock share functionality
    alert(`Mock share to ${platform}`);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !state.currentUser) return;
    
    addComment(post.id, commentText, replyTo || undefined);
    setCommentText("");
    setReplyTo(null);
  };

  return (
    <article className="min-h-screen pb-20 bg-background">
      {/* Header section with hero image */}
      <header className="relative w-full h-[60vh] min-h-[500px]">
        <img 
          src={post.coverImage} 
          alt={post.title} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pb-12 md:pb-16 text-center">
            {category && (
              <Link href={`/category/${category.slug}`}>
                <span className="inline-block bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm mb-6 hover:bg-primary/90 transition-colors">
                  {category.name}
                </span>
              </Link>
            )}
            <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-tight mb-6 max-w-3xl mx-auto">
              {post.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-8 max-w-2xl mx-auto">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-white/90">
              {author && (
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Avatar className="h-10 w-10 border border-white/20">
                    <AvatarImage src={author.avatar} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left leading-tight">
                    <span className="text-sm font-bold block text-white">{author.name}</span>
                    <span className="text-xs text-white/60">{formatDate(post.createdAt)} • {post.readingTime} min read</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-12">
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Social / Actions Sidebar (Sticky on desktop, horizontal on mobile) */}
          <aside className="lg:w-24 shrink-0">
            <div className="sticky top-24 flex lg:flex-col items-center gap-4 py-4 lg:py-0 border-y lg:border-y-0 lg:border-r border-border/50">
              <button 
                onClick={() => toggleLike(post.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-full hover:bg-muted transition-colors",
                  isLiked ? "text-primary" : "text-muted-foreground"
                )}
                title="Like"
              >
                <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                <span className="text-xs font-bold">{post.likes}</span>
              </button>
              
              <button 
                onClick={() => {
                  const commentsSection = document.getElementById('comments');
                  commentsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-1 p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                title="Comments"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="text-xs font-bold">{postComments.length}</span>
              </button>

              <button 
                onClick={() => toggleBookmark(post.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-full hover:bg-muted transition-colors",
                  isBookmarked ? "text-primary" : "text-muted-foreground"
                )}
                title="Bookmark"
              >
                <Bookmark className={cn("h-6 w-6", isBookmarked && "fill-current")} />
              </button>

              <div className="hidden lg:block w-8 h-px bg-border my-2"></div>

              <button onClick={() => handleShare('Twitter')} className="p-3 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors" title="Share on X">
                <SiX className="h-5 w-5" />
              </button>
              <button onClick={() => handleShare('LinkedIn')} className="p-3 text-muted-foreground hover:text-[#0077b5] rounded-full hover:bg-muted transition-colors" title="Share on LinkedIn">
                <Linkedin className="h-5 w-5" />
              </button>
              <button onClick={() => handleShare('WhatsApp')} className="p-3 text-muted-foreground hover:text-[#25D366] rounded-full hover:bg-muted transition-colors" title="Share on WhatsApp">
                <SiWhatsapp className="h-5 w-5" />
              </button>
            </div>
          </aside>

          {/* Article Body */}
          <div className="flex-1 min-w-0">
            <div 
              className="prose prose-lg prose-red dark:prose-invert max-w-3xl prose-headings:font-serif prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:font-serif prose-blockquote:text-xl prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* Tags */}
            <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
              <span className="text-sm font-bold mr-2 self-center">TAGS:</span>
              {post.tags.map(tag => (
                <span key={tag} className="bg-muted px-3 py-1 rounded-sm text-sm font-medium hover:bg-muted/80 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Author Box */}
            {author && (
              <div className="mt-12 bg-muted/30 border rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback className="text-2xl">{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left flex-1">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider block mb-1">About the Author</span>
                  <h3 className="font-serif text-2xl font-bold mb-3">{author.name}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {author.bio || `Contributor at Xzily covering ${category?.name || 'various topics'}.`}
                  </p>
                  <Button variant="outline" size="sm">View all posts by {author.name.split(' ')[0]}</Button>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <section id="comments" className="mt-16 pt-12 border-t">
              <h3 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
                Discussion <span className="bg-muted text-foreground text-sm px-3 py-1 rounded-full font-sans font-bold">{postComments.length}</span>
              </h3>

              {!state.currentUser ? (
                <div className="bg-muted/50 border rounded-xl p-8 text-center mb-12">
                  <h4 className="font-serif text-xl font-bold mb-2">Join the conversation</h4>
                  <p className="text-muted-foreground mb-6">Sign in to leave a comment, reply to others, and join the Xzily community.</p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/login"><Button>Sign In</Button></Link>
                    <Link href="/register"><Button variant="outline">Subscribe</Button></Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="mb-12">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0 hidden sm:block">
                      <AvatarImage src={state.currentUser.avatar} />
                      <AvatarFallback>{state.currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col gap-3">
                      {replyTo && (
                        <div className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                          <span className="text-muted-foreground">Replying to a comment...</span>
                          <button type="button" onClick={() => setReplyTo(null)} className="text-destructive font-medium hover:underline">Cancel reply</button>
                        </div>
                      )}
                      <Textarea 
                        placeholder="Share your thoughts..." 
                        className="min-h-[100px] resize-y bg-background"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={!commentText.trim()}>Post Comment</Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-8">
                {postComments.map(comment => {
                  const commentAuthor = state.users.find(u => u.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={commentAuthor?.avatar} />
                        <AvatarFallback>{commentAuthor?.name.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted/30 border rounded-xl p-4 md:p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-bold mr-2">{commentAuthor?.name || 'User'}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                            </div>
                            {state.currentUser?.id === comment.authorId && (
                              <button 
                                onClick={() => deleteComment(comment.id)}
                                className="text-xs text-destructive hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                            <button className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                              <Heart className="h-4 w-4" /> {comment.likes || 0}
                            </button>
                            <button 
                              onClick={() => {
                                setReplyTo(comment.id);
                                document.querySelector('textarea')?.focus();
                              }}
                              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 pl-4 md:pl-8 space-y-4 border-l-2 border-border/50">
                            {comment.replies.map(reply => {
                              const replyAuthor = state.users.find(u => u.id === reply.authorId);
                              return (
                                <div key={reply.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={replyAuthor?.avatar} />
                                    <AvatarFallback>{replyAuthor?.name.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-muted/20 border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <span className="font-bold text-sm mr-2">{replyAuthor?.name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                                      </div>
                                      {state.currentUser?.id === reply.authorId && (
                                        <button 
                                          onClick={() => deleteComment(reply.id)}
                                          className="text-xs text-destructive hover:underline"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground/90">{reply.content}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
