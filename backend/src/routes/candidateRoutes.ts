import { Router } from 'express';
import {
  addCandidate,
  getCandidateById,
  updateCandidateStage,
} from '../presentation/controllers/candidateController';

const router = Router();

router.post('/', async (req, res) => {
  try {
    // console.log(req.body); //Just in case you want to inspect the request body
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'An unexpected error occurred' });
    }
  }
});

router.get('/:id', getCandidateById);

/**
 * PUT /applications/:id/stage
 * Update the interview stage for a candidate's application
 * Body: { "new_stage": <interview_step_id> }
 */
router.put('/applications/:id/stage', updateCandidateStage);

export default router;
