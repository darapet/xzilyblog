import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  CreatePostBody,
  CreatePostResponse,
  ListFeaturedPostsResponse,
  GetPostParams,
  GetPostResponse,
  UpdatePostParams,
  UpdatePostBody,
  UpdatePostResponse,
  DeletePostParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/posts", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, tag, search } = query.data;
  const conditions = [];

  if (category) {
    conditions.push(eq(postsTable.category, category));
  }
  if (tag) {
    conditions.push(
      or(
        ilike(postsTable.title, `%${tag}%`),
        ilike(postsTable.excerpt, `%${tag}%`),
      ),
    );
  }
  if (search) {
    conditions.push(
      or(
        ilike(postsTable.title, `%${search}%`),
        ilike(postsTable.excerpt, `%${search}%`),
        ilike(postsTable.content, `%${search}%`),
      ),
    );
  }

  const rows = await db
    .select()
    .from(postsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(postsTable.publishedAt));

  const filtered = tag
    ? rows.filter((row) => row.tags.includes(tag))
    : rows;

  res.json(ListPostsResponse.parse(filtered));
});

router.get("/posts/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.featured, true))
    .orderBy(desc(postsTable.publishedAt))
    .limit(5);

  res.json(ListFeaturedPostsResponse.parse(rows));
});

router.post("/posts", async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const slug = slugify(parsed.data.title);

  const [post] = await db
    .insert(postsTable)
    .values({
      ...parsed.data,
      slug,
      tags: parsed.data.tags ?? [],
      readingMinutes: estimateReadingMinutes(parsed.data.content),
    })
    .returning();

  res.status(201).json(CreatePostResponse.parse(post));
});

router.get("/posts/:slug", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.slug, params.data.slug));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(GetPostResponse.parse(post));
});

router.patch("/posts/:slug", async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.title) {
    update.slug = slugify(parsed.data.title);
  }
  if (parsed.data.content) {
    update.readingMinutes = estimateReadingMinutes(parsed.data.content);
  }

  const [post] = await db
    .update(postsTable)
    .set(update)
    .where(eq(postsTable.slug, params.data.slug))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(UpdatePostResponse.parse(post));
});

router.delete("/posts/:slug", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .delete(postsTable)
    .where(eq(postsTable.slug, params.data.slug))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.sendStatus(204);
});

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default router;
