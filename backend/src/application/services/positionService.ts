import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CandidateInPosition {
  candidateId: number;
  fullName: string;
  currentInterviewStep: number;
  currentInterviewStepName: string;
  averageScore: number | null;
  applicationId: number;
}

/**
 * Get all candidates applying for a specific position with their progress
 * @param positionId - The ID of the position
 * @returns Array of candidates with their interview progress and average scores
 */
export const getCandidatesByPosition = async (
  positionId: number,
): Promise<CandidateInPosition[]> => {
  // Verify position exists
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error('Position not found');
  }

  // Get applications for this position with candidate and interview data
  const applications = await prisma.application.findMany({
    where: {
      positionId: positionId,
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      interviewStep: {
        select: {
          id: true,
          name: true,
        },
      },
      interviews: {
        select: {
          score: true,
        },
      },
    },
  });

  // Map to the desired format and calculate average scores
  const candidates: CandidateInPosition[] = applications.map((app) => {
    // Calculate average score from all interviews
    const scores = app.interviews
      .map((interview) => interview.score)
      .filter((score): score is number => score !== null);

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null;

    return {
      candidateId: app.candidate.id,
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.currentInterviewStep,
      currentInterviewStepName: app.interviewStep.name,
      averageScore: averageScore,
      applicationId: app.id,
    };
  });

  return candidates;
};
