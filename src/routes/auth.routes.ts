import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";

const router = express.Router();

// Match everything inside this router
router.all("/{*splat}", toNodeHandler(auth));

export default router;