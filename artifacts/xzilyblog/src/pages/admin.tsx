import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListPosts, 
  useCreatePost, 
  useUpdatePost, 
  useDeletePost,
  getListPostsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { PenTool, Plus, Settings2, Trash2, Edit3, Image as ImageIcon, X } from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PostSummary } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const postSchema = z.object({
  title: z.string().min(2, "Title is required"),
  excerpt: z.string().min(10, "Excerpt is required"),
  content: z.string().optional(), // Optional for edit mode
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  tags: z.string().optional(), // Will be converted to array
  authorName: z.string().min(2, "Author name is required"),
  featured: z.boolean().default(false),
});

type FormValues = z.infer<typeof postSchema>;

export default function Admin() {
  const { data: posts, isLoading } = useListPosts();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostSummary | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostSummary | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      category: "",
      tags: "",
      authorName: "Author",
      featured: false,
    },
  });

  const openNewPost = () => {
    setEditingPost(null);
    form.reset({
      title: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      category: "",
      tags: "",
      authorName: "Author",
      featured: false,
    });
    setIsEditorOpen(true);
  };

  const openEditPost = (post: PostSummary) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      excerpt: post.excerpt,
      content: "", // We don't have full content in PostSummary, but this is a simplified admin
      // In a real app we'd fetch the full post here or make the user edit content blank if they want to override
      coverImageUrl: post.coverImageUrl || "",
      category: post.category,
      tags: post.tags.join(", "),
      authorName: post.authorName,
      featured: post.featured,
    });
    // We should ideally fetch the full post content to edit it. For this mockup, we'll leave it blank.
    setIsEditorOpen(true);
  };

  const confirmDelete = (post: PostSummary) => {
    setPostToDelete(post);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!postToDelete) return;
    
    deletePost.mutate(
      { slug: postToDelete.slug },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          setIsDeleteOpen(false);
          setPostToDelete(null);
          toast({ title: "Post deleted successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to delete post" });
        }
      }
    );
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      coverImageUrl: values.coverImageUrl || undefined,
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };

    if (editingPost) {
      // For editing, only send fields that are provided
      const updatePayload = {
        ...payload,
        content: values.content || undefined, // If empty, don't update content
      };
      
      updatePost.mutate(
        { slug: editingPost.slug, data: updatePayload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            setIsEditorOpen(false);
            toast({ title: "Post updated successfully" });
          },
          onError: () => toast({ variant: "destructive", title: "Failed to update post" })
        }
      );
    } else {
      createPost.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            setIsEditorOpen(false);
            toast({ title: "Post created successfully" });
          },
          onError: () => toast({ variant: "destructive", title: "Failed to create post" })
        }
      );
    }
  };

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold flex items-center gap-3">
              <Settings2 className="text-primary" /> Workspace
            </h1>
            <p className="text-muted-foreground mt-2">Manage your stories and publications.</p>
          </div>
          <Button onClick={openNewPost} size="lg" className="rounded-full shadow-lg shadow-primary/20">
            <Plus className="mr-2 w-5 h-5" /> New Story
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="font-semibold text-lg">Published Posts</h2>
          </div>
          
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading posts...</div>
            ) : posts?.length === 0 ? (
              <div className="p-16 text-center">
                <PenTool className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">Your desk is empty</h3>
                <p className="text-muted-foreground mb-6">Write your first story to share with the world.</p>
                <Button onClick={openNewPost} variant="outline">Start Writing</Button>
              </div>
            ) : (
              posts?.map((post) => (
                <div key={post.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.featured && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-medium">Featured</span>}
                      <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded">{post.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.publishedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg truncate pr-4">{post.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditPost(post)}>
                      <Edit3 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(post)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-serif text-2xl">
                {editingPost ? "Edit Story" : "Write a New Story"}
              </DialogTitle>
              <DialogDescription>
                Craft your thoughts beautifully.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="An interesting thought..." className="text-lg font-serif" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short summary for the index..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Content {editingPost && "(Leave blank to keep existing)"}</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write your story here... Use double newlines for paragraphs." className="min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Design, Life, Tech" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="writing, inspiration, nature (comma separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="https://..." className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Feature this post</FormLabel>
                        <FormDescription>
                          Featured posts appear in the hero section on the home page.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                    {createPost.isPending || updatePost.isPending ? "Saving..." : editingPost ? "Update Story" : "Publish Story"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Story
              </DialogTitle>
              <DialogDescription className="py-4 text-base">
                Are you sure you want to delete <strong>"{postToDelete?.title}"</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
                {deletePost.isPending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
