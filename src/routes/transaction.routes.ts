import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validate } from "../middlewares/common/validate.middleware.js";

// Validation schemas
import { createTransactionSchema } from "../schemas/transactions/createTransaction.schema.js";
import { updateTransactionSchema } from "../schemas/transactions/updateTransaction.schema.js";
import {
  deleteTransactionRequestSchema,
  deleteTransactionSchema,
} from "../schemas/transactions/deleteTransaction.schema.js";

// Authorization middlewares
import { authoriseBookAccess } from "../middlewares/transactions/authoriseBookAccess.middleware.js";
import { authoriseCategoryAccess } from "../middlewares/transactions/authoriseCategoryAccess.middleware.js";
import { authoriseTransactionAccess } from "../middlewares/transactions/authoriseTransactionAccess.middleware.js";

// Controllers
import { createTransaction } from "../controllers/transactions/createTransaction.controller.js";
import { getTransactions } from "../controllers/transactions/getTransactions.controller.js";
import { updateTransaction } from "../controllers/transactions/updateTransaction.controller.js";
import { deleteTransactionRequest } from "../controllers/transactions/deleteTransactionRequest.controller.js";
import { deleteTransaction } from "../controllers/transactions/deleteTransaction.controller.js";

const router = express.Router();

// 1. Create a transaction
router.post(
  "/",
  [
    isAuthenticated,
    validate(createTransactionSchema),
    authoriseBookAccess,
    authoriseCategoryAccess,
  ],
  createTransaction
);

// 2. Get transaction history
router.get("/", [isAuthenticated], getTransactions);

// 3. Update a transaction
router.put(
  "/:id",
  [
    isAuthenticated,
    validate(updateTransactionSchema),
    authoriseTransactionAccess,
    authoriseBookAccess,
    authoriseCategoryAccess,
  ],
  updateTransaction
);

// 4. Request deletion token (Phase 1)
router.post(
  "/:id/delete-request",
  [
    isAuthenticated,
    validate(deleteTransactionRequestSchema),
    authoriseTransactionAccess,
  ],
  deleteTransactionRequest
);

// 5. Confirm deletion (Phase 2)
router.delete(
  "/:id",
  [
    isAuthenticated,
    validate(deleteTransactionSchema),
    authoriseTransactionAccess,
  ],
  deleteTransaction
);

export default router;
