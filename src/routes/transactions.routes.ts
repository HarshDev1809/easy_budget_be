import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import {
  createTransaction,
  updateTransaction,
  requestDeleteTransaction,
  confirmDeleteTransaction,
} from "../controllers/transactions.controller.js";

const router = Router();

router.use(isAuthenticated);

router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.post("/:id/delete/request", requestDeleteTransaction);
router.delete("/:id", confirmDeleteTransaction);

export default router;
