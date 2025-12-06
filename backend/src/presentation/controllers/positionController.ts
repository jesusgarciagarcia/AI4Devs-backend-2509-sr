import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

/**
 * Controller for GET /positions/:id/candidates
 * Returns all candidates applying for a specific position with their interview progress
 */
export const getCandidatesForPosition = async (req: Request, res: Response) => {
  try {
    const positionId = parseInt(req.params.id);

    // Validate ID format
    if (isNaN(positionId)) {
      return res.status(400).json({
        error: 'Invalid position ID format',
        message: 'Position ID must be a valid number',
      });
    }

    const candidates = await getCandidatesByPosition(positionId);

    return res.status(200).json({
      success: true,
      data: {
        positionId: positionId,
        candidateCount: candidates.length,
        candidates: candidates,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message === 'Position not found') {
        return res.status(404).json({
          error: 'Position not found',
          message: `No position found with ID ${req.params.id}`,
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
