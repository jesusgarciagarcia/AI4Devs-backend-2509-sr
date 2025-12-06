import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

export const addCandidate = async (candidateData: any) => {
  try {
    validateCandidateData(candidateData); // Validar los datos del candidato
  } catch (error: any) {
    throw new Error(error);
  }

  const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
  try {
    const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
    const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

    // Guardar la educación del candidato
    if (candidateData.educations) {
      for (const education of candidateData.educations) {
        const educationModel = new Education(education);
        educationModel.candidateId = candidateId;
        await educationModel.save();
        candidate.education.push(educationModel);
      }
    }

    // Guardar la experiencia laboral del candidato
    if (candidateData.workExperiences) {
      for (const experience of candidateData.workExperiences) {
        const experienceModel = new WorkExperience(experience);
        experienceModel.candidateId = candidateId;
        await experienceModel.save();
        candidate.workExperience.push(experienceModel);
      }
    }

    // Guardar los archivos de CV
    if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
      const resumeModel = new Resume(candidateData.cv);
      resumeModel.candidateId = candidateId;
      await resumeModel.save();
      candidate.resumes.push(resumeModel);
    }
    return savedCandidate;
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint failed on the fields: (`email`)
      throw new Error('The email already exists in the database');
    } else {
      throw error;
    }
  }
};

export const findCandidateById = async (
  id: number,
): Promise<Candidate | null> => {
  try {
    const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
    return candidate;
  } catch (error) {
    console.error('Error al buscar el candidato:', error);
    throw new Error('Error al recuperar el candidato');
  }
};

/**
 * Update the interview stage for a candidate's application
 * @param applicationId - The ID of the application to update
 * @param newStageId - The ID of the new interview step
 * @returns The updated application data
 */
export const updateApplicationStage = async (
  applicationId: number,
  newStageId: number,
) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        position: {
          select: {
            title: true,
            interviewFlowId: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Verify the new stage exists and belongs to the correct interview flow
    const interviewStep = await prisma.interviewStep.findFirst({
      where: {
        id: newStageId,
        interviewFlowId: application.position.interviewFlowId,
      },
      include: {
        interviewType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!interviewStep) {
      throw new Error('Invalid interview step for this position');
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        currentInterviewStep: newStageId,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        interviewStep: {
          select: {
            id: true,
            name: true,
            orderIndex: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      applicationId: updatedApplication.id,
      candidate: {
        id: updatedApplication.candidate.id,
        fullName: `${updatedApplication.candidate.firstName} ${updatedApplication.candidate.lastName}`,
        email: updatedApplication.candidate.email,
      },
      position: {
        id: updatedApplication.position.id,
        title: updatedApplication.position.title,
      },
      previousStage: application.currentInterviewStep,
      currentStage: {
        id: updatedApplication.interviewStep.id,
        name: updatedApplication.interviewStep.name,
        orderIndex: updatedApplication.interviewStep.orderIndex,
      },
      updatedAt: new Date(),
    };
  } finally {
    await prisma.$disconnect();
  }
};
