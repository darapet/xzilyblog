import { useStore } from "@/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";

export function AdminCreatePost() {
  const { state, createPost } = useStore();
  const [location, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id || "");
  const [coverImage, setCoverImage] = useState("/images/cover-1.jpg"); // Default for demo
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<'draft'|'published'>("draft");

  if (!state.currentUser || state.currentUser.role !== 'admin') {
    setLocation('/admin/login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    createPost({
      title,
      slug: generateSlug(title),
      excerpt,
      content: content.replace(/\n/g, '<br/>'), // Naive HTML formatting for demo text area
      categoryId,
      authorId: state.currentUser.id,
      coverImage,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status,
      readingTime: Math.max(1, Math.ceil(content.split(' ').length / 200))
    });

    setLocation('/admin');
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Navbar for editor */}
      <header className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium text-muted-foreground">Drafting New Post</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStatus('draft')}>Save Draft</Button>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">Publish</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-6">
        <form id="post-form" onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Cover Image URL</label>
              <div className="flex gap-4">
                <Input 
                  value={coverImage} 
                  onChange={e => setCoverImage(e.target.value)} 
                  placeholder="/images/cover.jpg or https://..."
                  className="flex-1"
                />
                <Button type="button" variant="secondary"><ImageIcon className="h-4 w-4 mr-2" /> Upload</Button>
              </div>
            </div>
            {coverImage && (
              <img src={coverImage} alt="Cover preview" className="w-full h-48 object-cover rounded-lg border" />
            )}
          </div>

          <div className="bg-card p-8 rounded-xl border shadow-sm space-y-6">
            <input
              type="text"
              placeholder="Post Title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-4xl md:text-5xl font-serif font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground"
              required
            />
            
            <Textarea
              placeholder="Write a brief excerpt..."
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="text-xl font-medium border-none shadow-none px-0 bg-transparent resize-none min-h-[80px] text-muted-foreground"
              required
            />

            <div className="h-px bg-border my-4" />

            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                >
                  {state.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Tags (comma separated)</label>
                <Input 
                  value={tags} 
                  onChange={e => setTags(e.target.value)} 
                  placeholder="Design, Tech, Future..."
                />
              </div>
            </div>

            <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Content Editor (HTML Supported)</label>
            <Textarea
              placeholder="Start writing..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[500px] font-sans text-lg leading-relaxed border p-4 bg-background"
              required
            />
          </div>
        </form>
      </main>
    </div>
  );
}
