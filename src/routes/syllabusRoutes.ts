import { Router } from "express";
import { getSyllabus } from "../controllers/syllabusController.js";

const router = Router();

router.get("/", getSyllabus);

export default router;