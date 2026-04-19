import {Router} from 'express';
import {status} from '../controllers/health/status.controller.js'
import authRoutes from "./auth.routes.js"
import {debug} from '../controllers/debug/debug.controller.js'

const routes = Router();

routes.use('/auth',authRoutes)
routes.get("/health",status);
routes.use('/debug',debug);

export default routes;

