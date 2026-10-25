import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getDiagnosticQuestions,
  getDiagnosticResult,
  submitDiagnostic,
} from "../controllers/diagnosticController.js";

const router = Router();

router.get("/questions", authenticate, getDiagnosticQuestions);

router.get("/result", authenticate, getDiagnosticResult);

router.post("/submit", authenticate, submitDiagnostic);

export default router;