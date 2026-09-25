import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    getMe,
    updateOnboarding,
} from "../controllers/usersController.js";

const router = Router();

router.get("/", authenticate, getMe);

router.post("/onboarding", authenticate, updateOnboarding);

export default router;