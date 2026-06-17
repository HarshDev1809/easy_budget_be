import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validate } from "../middlewares/common/validate.middleware.js";
import { createBookSchema } from "../schemas/books/createBook.schema.js";
import { createBook } from "../controllers/books/createBook.controller.js";
import { getBooks } from "../controllers/books/getBooks.controller.js";

const router = express.Router();

router.post("/", [isAuthenticated, validate(createBookSchema)],createBook);
router.get("/", [isAuthenticated],getBooks);

export default router;