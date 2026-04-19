import {Router} from 'express';
import { validate } from '../middlewares/common/validate.middleware.js';
import { signup } from '../controllers/auth/signup.controller.js';
import { signupSchema } from '../schemas/auth/signup.schema.js';
// import {signinSchema} from   '../schemas/auth/signin.schema.js';

const router = Router();

// router.post('/signin',[validate(signinSchema)])
router.post('/signup',[validate(signupSchema)],signup);

export default router;
