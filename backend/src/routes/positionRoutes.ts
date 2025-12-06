import { Router } from 'express';
import { getCandidatesForPosition } from '../presentation/controllers/positionController';

const router = Router();

/**
 * GET /positions/:id/candidates
 * Retrieve all candidates for a specific position with their interview progress
 */
router.get('/:id/candidates', getCandidatesForPosition);

export default router;
