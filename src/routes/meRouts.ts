import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    getMe,
    updateOnboarding,
} from "../controllers/usersController.js";
import { getProgress } from "../controllers/lessonController.js";

const router = Router();

router.get("/", authenticate, getMe);

router.get("/progress", authenticate, getProgress);

router.post("/onboarding", authenticate, updateOnboarding);

export default router;