import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  completeLesson,
  getLesson,
  startLesson,
} from "../controllers/lessonController.js";

const router = Router();

router.get("/:id", authenticate, getLesson);

router.post("/:id/start", authenticate, startLesson);

router.post("/:id/complete", authenticate, completeLesson);

export default router;
