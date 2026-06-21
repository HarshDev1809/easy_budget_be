import {Router} from 'express';
import {status} from '../controllers/health/status.controller.js'
import authRoutes from "./auth.routes.js"
import {debug} from '../controllers/debug/debug.controller.js'
import userRoutes from "./user.routes.js"
import booksRoutes from "./book.routes.js"
import categoriesRoutes from "./categories.routes.js"

const routes = Router();
// routes.use("/auth",authRoutes)
routes.get("/health",status);
routes.use('/debug',debug);
routes.use("/user",userRoutes)
routes.use("/books",booksRoutes);
routes.use("/categories",categoriesRoutes)

export default routes;

