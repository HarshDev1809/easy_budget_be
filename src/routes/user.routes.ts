import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { getSession } from "../controllers/user/getSession.controller.js";

const router = Router();

router.get('/session',[isAuthenticated],getSession)

export default router