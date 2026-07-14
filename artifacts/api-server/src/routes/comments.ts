import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, commentsTable, postsTable } from "@workspace/db";
import {
  ListCommentsParams,
  ListCommentsResponse,
  CreateCommentParams,
  CreateCommentBody,
  CreateCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/posts/:slug/comments", async (req, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
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

  const rows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, post.id))
    .orderBy(asc(commentsTable.createdAt));

  res.json(
    ListCommentsResponse.parse(
      rows.map((row) => ({ ...row, postSlug: post.slug })),
    ),
  );
});

router.post("/posts/:slug/comments", async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const [comment] = await db
    .insert(commentsTable)
    .values({ ...parsed.data, postId: post.id })
    .returning();

  res
    .status(201)
    .json(
      CreateCommentResponse.parse({ ...comment, postSlug: post.slug }),
    );
});

export default router;
