import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/signup', signup); // Only for residents
router.post('/login', login);   // For both residents and staff

export default router; 