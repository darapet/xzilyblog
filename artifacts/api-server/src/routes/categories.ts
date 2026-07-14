import { Router, type IRouter } from "express";
import { count } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";
import { ListCategoriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      name: postsTable.category,
      postCount: count(postsTable.id),
    })
    .from(postsTable)
    .groupBy(postsTable.category)
    .orderBy(postsTable.category);

  res.json(ListCategoriesResponse.parse(rows));
});

export default router;
