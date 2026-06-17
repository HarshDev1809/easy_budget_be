import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validate } from "../middlewares/common/validate.middleware.js";
import { createBookSchema } from "../schemas/books/createBook.schema.js";
import { createBook } from "../controllers/books/createBook.controller.js";

const router = express.Router();

router.post("/books", [isAuthenticated, validate(createBookSchema)],createBook);

export default router;