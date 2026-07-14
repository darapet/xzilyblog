import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Shell>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-8">
          <BookOpen size={48} />
        </div>
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-foreground mb-6">404</h1>
        <h2 className="text-2xl font-medium text-foreground mb-4">Page not found</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-10">
          The story you're looking for seems to have been misplaced or deleted.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full shadow-lg shadow-primary/20">
            <ArrowLeft className="mr-2 w-4 h-4" /> Return to Home
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
