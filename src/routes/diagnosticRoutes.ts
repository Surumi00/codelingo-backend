import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getDiagnosticQuestions,
  submitDiagnostic,
} from "../controllers/diagnosticController.js";

const router = Router();

router.get("/questions", authenticate, getDiagnosticQuestions);

router.post("/submit", authenticate, submitDiagnostic);

export default router;