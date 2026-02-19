import express, { Router } from 'express';
import InitializeController from '../controllers/Initialize.js';

const router: Router = express.Router();

// Set tag
router.get('/initialize', InitializeController.init);

export default router;
