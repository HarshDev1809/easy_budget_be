import {Router} from 'express';
import {status} from '../controllers/health/status.controller.js'

const routes = Router();

routes.get("/health",status);

export default routes;

