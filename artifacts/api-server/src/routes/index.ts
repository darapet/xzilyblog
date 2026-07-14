import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(categoriesRouter);

export default router;
