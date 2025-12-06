import { Request, Response } from 'express';
import {
  addCandidate,
  findCandidateById,
  updateApplicationStage,
} from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
  try {
    const candidateData = req.body;
    const candidate = await addCandidate(candidateData);
    res
      .status(201)
      .json({ message: 'Candidate added successfully', data: candidate });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(400)
        .json({ message: 'Error adding candidate', error: error.message });
    } else {
      res
        .status(400)
        .json({ message: 'Error adding candidate', error: 'Unknown error' });
    }
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const candidate = await findCandidateById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Controller for PUT /applications/:id/stage
 * Updates the interview stage for a candidate application (for kanban movement)
 * Note: Using application ID for more precise control in kanban context
 */
export const updateCandidateStage = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);

    // Validate application ID
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Invalid application ID format',
        message: 'Application ID must be a valid number',
      });
    }

    // Validate request body
    const { new_stage } = req.body;

    if (!new_stage) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Field "new_stage" is required in request body',
      });
    }

    const newStageId = parseInt(new_stage);

    if (isNaN(newStageId)) {
      return res.status(400).json({
        error: 'Invalid stage format',
        message: 'new_stage must be a valid interview step ID (number)',
      });
    }

    // Update the application stage
    const result = await updateApplicationStage(applicationId, newStageId);

    return res.status(200).json({
      success: true,
      message: 'Application stage updated successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Application not found',
          message: `No application found with ID ${req.params.id}`,
        });
      }

      if (error.message === 'Invalid interview step for this position') {
        return res.status(400).json({
          error: 'Invalid interview step',
          message:
            "The specified interview step does not belong to this position's interview flow",
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    });
  }
};

export { addCandidate };
