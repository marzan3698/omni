import { Request, Response } from 'express';
import { z } from 'zod';
import { LeadMeetingStatus } from '@prisma/client';
import { leadMeetingService } from '../services/leadMeeting.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';

const createLeadMeetingSchema = z.object({
  assignedTo: z.number().int().positive('Assigned employee is required'),
  title: z.string().min(1, 'Meeting title is required'),
  description: z.string().optional(),
  meetingTime: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
    z.date({ required_error: 'Meeting time is required' })
  ),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  platform: z.string().min(1, 'Platform is required'),
  meetingLink: z.string().min(1, 'Meeting connection info is required'),
  status: z
    .enum(['Scheduled', 'Completed', 'Canceled'])
    .optional(),
  clientId: z.number().int().positive().optional(),
});

const updateLeadMeetingSchema = createLeadMeetingSchema.partial();

export const leadMeetingController = {
  /**
   * Get all meetings for a lead
   * GET /api/leads/:leadId/meetings
   */
  getLeadMeetings: async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const companyId = parseInt((req.query.companyId as string) || (req.body.companyId as string));

      if (isNaN(leadId)) {
        return sendError(res, 'Invalid lead ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const meetings = await leadMeetingService.getLeadMeetings(leadId, companyId);
      return sendSuccess(res, meetings, 'Lead meetings retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve lead meetings', 500);
    }
  },

  /**
   * Create a meeting for a lead
   * POST /api/leads/:leadId/meetings
   */
  createLeadMeeting: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      const leadId = parseInt(req.params.leadId);
      const companyId = user?.companyId || parseInt((req.body.companyId as string) || '');

      if (isNaN(leadId)) {
        return sendError(res, 'Invalid lead ID', 400);
      }
      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }
      if (!user?.id) {
        return sendError(res, 'User ID is required', 400);
      }

      const validatedData = createLeadMeetingSchema.parse(req.body);

      const meeting = await leadMeetingService.createLeadMeeting({
        companyId,
        leadId,
        assignedTo: validatedData.assignedTo,
        clientId: validatedData.clientId,
        createdBy: user.id,
        title: validatedData.title,
        description: validatedData.description,
        meetingTime: validatedData.meetingTime,
        durationMinutes: validatedData.durationMinutes,
        platform: validatedData.platform,
        meetingLink: validatedData.meetingLink,
        status: (validatedData.status as LeadMeetingStatus) || 'Scheduled',
      });

      return sendSuccess(res, meeting, 'Lead meeting created successfully', 201);
    } catch (error) {
      console.error('Error creating lead meeting:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', error);
      return sendError(res, `Failed to create lead meeting: ${errorMessage}`, 500);
    }
  },

  /**
   * Update a meeting for a lead
   * PUT /api/leads/:leadId/meetings/:id
   */
  updateLeadMeeting: async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const id = parseInt(req.params.id);
      const companyId = parseInt((req.query.companyId as string) || (req.body.companyId as string));

      if (isNaN(leadId) || isNaN(id)) {
        return sendError(res, 'Invalid lead or meeting ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const validatedData = updateLeadMeetingSchema.parse(req.body);

      const updateData: Record<string, unknown> = {
        ...validatedData,
      };

      if (validatedData.meetingTime) {
        updateData.meetingTime =
          validatedData.meetingTime instanceof Date
            ? validatedData.meetingTime
            : new Date(validatedData.meetingTime);
      }
      if (validatedData.assignedTo !== undefined) {
        updateData.assignedTo = validatedData.assignedTo;
      }

      const meeting = await leadMeetingService.updateLeadMeeting(
        id,
        leadId,
        companyId,
        updateData
      );
      return sendSuccess(res, meeting, 'Lead meeting updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update lead meeting', 500);
    }
  },

  /**
   * Delete a meeting for a lead
   * DELETE /api/leads/:leadId/meetings/:id
   */
  deleteLeadMeeting: async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const id = parseInt(req.params.id);
      const companyId = parseInt((req.query.companyId as string) || (req.body.companyId as string));

      if (isNaN(leadId) || isNaN(id)) {
        return sendError(res, 'Invalid lead or meeting ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      await leadMeetingService.deleteLeadMeeting(id, leadId, companyId);
      return sendSuccess(res, null, 'Lead meeting deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete lead meeting', 500);
    }
  },

  /**
   * Get all meetings for a company (role-based filtering)
   * GET /api/meetings
   */
  getAllMeetings: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      if (!user?.companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};

      // Parse optional filters
      if (req.query.status) {
        filters.status = req.query.status as LeadMeetingStatus;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.leadId) {
        filters.leadId = parseInt(req.query.leadId as string);
        if (isNaN(filters.leadId)) {
          return sendError(res, 'Invalid lead ID', 400);
        }
      }

      const meetings = await leadMeetingService.getAllMeetings(
        user.companyId,
        user.id,
        user.role?.name,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      return sendSuccess(res, meetings, 'Meetings retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Error getting all meetings:', error);
      return sendError(res, 'Failed to retrieve meetings', 500);
    }
  },

  /**
   * Get next upcoming meeting for current user (within 1 hour)
   * GET /api/meetings/upcoming
   */
  getUpcomingMeeting: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      if (!user?.id) {
        return sendError(res, 'User ID is required', 400);
      }
      if (!user?.companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const meeting = await leadMeetingService.getUpcomingMeeting(user.id, user.companyId);

      if (!meeting) {
        return sendSuccess(res, null, 'No upcoming meeting found');
      }

      return sendSuccess(res, meeting, 'Upcoming meeting retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Error getting upcoming meeting:', error);
      return sendError(res, 'Failed to retrieve upcoming meeting', 500);
    }
  },
};

