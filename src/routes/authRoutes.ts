import { Router } from "express";
import { login, register } from "../controllers/usersController.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
