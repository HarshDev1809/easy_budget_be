import express from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware.js";
import { validate } from "../middlewares/common/validate.middleware.js";
import { createCategorySchema } from "../schemas/categories/createCategory.schema.js";
import { getCategories } from "../controllers/categories/getCategories.controller.js";
import { createCategory } from "../controllers/categories/createCategories.controller.js";
import { deleteCategory } from "../controllers/categories/deleteCategories.controller.js";
import { updateCategorySchema } from "../schemas/categories/updateCategory.schema.js";
import { updateCategory } from "../controllers/categories/updateCategories.controller.js";

const router = express.Router();

router.get("/:bookId", [isAuthenticated], getCategories);
router.post("/", [isAuthenticated, validate(createCategorySchema)], createCategory);
router.patch("/:id", [isAuthenticated, validate(updateCategorySchema)], updateCategory);
router.delete("/:id", [isAuthenticated], deleteCategory);

export default router;