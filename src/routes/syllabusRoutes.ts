import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getSyllabus } from "../controllers/syllabusController.js";

const router = Router();

router.get("/", authenticate, getSyllabus);

export default router;