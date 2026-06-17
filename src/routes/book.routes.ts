import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validate } from "../middlewares/common/validate.middleware.js";
import { createBookSchema } from "../schemas/books/createBook.schema.js";
import { createBook } from "../controllers/books/createBook.controller.js";
import { getBooks } from "../controllers/books/getBooks.controller.js";
import { authoriseUser } from "../middlewares/books/authoriseUser.middleware.js";
import { bookDeleteRequest } from "../controllers/books/bookDeleteRequest.controller.js";
import { deleteBookSchema } from "../schemas/books/deleteBook.schema.js";
import { deleteBook } from "../controllers/books/deleteBook.controller.js";

const router = express.Router();

router.post("/", [isAuthenticated, validate(createBookSchema)],createBook);
router.get("/", [isAuthenticated],getBooks);
router.post("/:bookId/delete-request", [isAuthenticated,authoriseUser],bookDeleteRequest);
router.delete("/:bookId",[isAuthenticated,authoriseUser,validate(deleteBookSchema)],deleteBook)

export default router;