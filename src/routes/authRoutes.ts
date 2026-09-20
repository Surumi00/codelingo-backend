import { Router } from "express";
import { login, register,getMe } from "../controllers/usersController.js";
import { authenticate } from "../middleware/authMiddleware.js";
export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, getMe);

export default authRouter;