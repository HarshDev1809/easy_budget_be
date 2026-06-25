import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validateTransaction, validateDeleteToken } from "../middlewares/transactions/validateTransaction.js";
import { createTransaction } from "../controllers/transactions/createTransaction.js";
import { updateTransaction } from "../controllers/transactions/updateTransaction.js";
import { requestDeleteTransaction, confirmDeleteTransaction } from "../controllers/transactions/deleteTransaction.js";

const router = Router();

router.post("/", [isAuthenticated, validateTransaction], createTransaction);
router.put("/:id", [isAuthenticated, validateTransaction], updateTransaction);
router.post("/:id/delete/request", [isAuthenticated], requestDeleteTransaction);
router.delete("/:id", [isAuthenticated, validateDeleteToken], confirmDeleteTransaction);

export default router;
