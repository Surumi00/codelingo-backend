import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkExercise } from "../controllers/lessonController.js";

const router = Router();

router.post("/:id/check", authenticate, checkExercise);

export default router;
