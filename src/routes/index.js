import {Router} from 'express';
import {status} from '../controllers/health/status.controller.js'
import authRoutes from "./auth.routes.js"
const routes = Router();

routes.use('/auth',authRoutes)
routes.get("/health",status);

export default routes;

