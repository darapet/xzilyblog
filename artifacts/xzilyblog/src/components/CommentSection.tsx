import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListComments, useCreateComment } from "@workspace/api-client-react";
import { getListCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const commentSchema = z.object({
  authorName: z.string().min(2, "Name must be at least 2 characters"),
  body: z.string().min(3, "Comment must be at least 3 characters"),
});

export function CommentSection({ postSlug }: { postSlug: string }) {
  const { data: comments, isLoading } = useListComments(postSlug);
  const createComment = useCreateComment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      body: "",
    },
  });

  const onSubmit = (values: z.infer<typeof commentSchema>) => {
    createComment.mutate(
      { slug: postSlug, data: values },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postSlug) });
          toast({
            title: "Comment added",
            description: "Thanks for sharing your thoughts!",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Uh oh",
            description: "Failed to post comment. Try again.",
          });
        },
      }
    );
  };

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="text-primary" />
        <h3 className="text-2xl font-serif font-bold">
          Conversations {comments && comments.length > 0 && <span className="text-muted-foreground text-lg ml-1 font-sans">({comments.length})</span>}
        </h3>
      </div>

      <div className="mb-12 bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <h4 className="text-lg font-medium mb-4">Leave a reply</h4>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What are your thoughts on this?" 
                      className="min-h-[120px] bg-background resize-y" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={createComment.isPending}
              className="group"
            >
              {createComment.isPending ? "Posting..." : "Post Comment"}
              <Send className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
          </form>
        </Form>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))
        ) : comments?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground italic">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-5 rounded-xl transition-colors hover:bg-card/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <User size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-semibold text-foreground">{comment.authorName}</h5>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
