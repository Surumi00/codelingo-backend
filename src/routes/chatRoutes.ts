import { Router } from "express";
import { chat } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticate, chat);

export default router;
