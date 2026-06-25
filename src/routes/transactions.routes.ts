import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import {
  createTransaction,
  updateTransaction,
  requestDeleteTransaction,
  confirmDeleteTransaction,
} from "../controllers/transactions/transactions.controller.js";

const router = Router();

router.post("/", [isAuthenticated], createTransaction);
router.put("/:id", [isAuthenticated], updateTransaction);
router.post("/:id/delete/request", [isAuthenticated], requestDeleteTransaction);
router.delete("/:id", [isAuthenticated], confirmDeleteTransaction);

export default router;
