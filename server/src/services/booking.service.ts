import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const CALL_DEFAULT_DURATION_MINUTES = 15;

export interface AssertEmployeeAvailableParams {
  companyId: number;
  employeeId: number;
  startTime: Date;
  durationMinutes: number;
  excludeCallId?: number;
  excludeMeetingId?: number;
}

/**
 * Throws AppError(409) if the employee has any Scheduled call or meeting overlapping the given slot.
 * Overlap: newStart < existingEnd && newEnd > existingStart.
 * Only Scheduled status is considered.
 */
export async function assertEmployeeAvailable(params: AssertEmployeeAvailableParams): Promise<void> {
  const { companyId, employeeId, startTime, durationMinutes, excludeCallId, excludeMeetingId } = params;
  const start = startTime.getTime();
  const end = start + durationMinutes * 60 * 1000;

  const callsWhere: Parameters<typeof prisma.leadCall.findMany>[0]['where'] = {
    companyId,
    assignedTo: employeeId,
    status: 'Scheduled',
  };
  if (excludeCallId != null) {
    callsWhere.id = { not: excludeCallId };
  }

  const scheduledCalls = await prisma.leadCall.findMany({
    where: callsWhere,
    select: { id: true, callTime: true, durationMinutes: true },
  });

  for (const call of scheduledCalls) {
    const callDuration = call.durationMinutes ?? CALL_DEFAULT_DURATION_MINUTES;
    const existingStart = call.callTime.getTime();
    const existingEnd = existingStart + callDuration * 60 * 1000;
    if (start < existingEnd && end > existingStart) {
      throw new AppError(
        `Employee already has a scheduled call at this time (call #${call.id}). Please choose another time or employee.`,
        409
      );
    }
  }

  const meetingsWhere: Parameters<typeof prisma.leadMeeting.findMany>[0]['where'] = {
    companyId,
    assignedTo: employeeId,
    status: 'Scheduled',
  };
  if (excludeMeetingId != null) {
    meetingsWhere.id = { not: excludeMeetingId };
  }

  const scheduledMeetings = await prisma.leadMeeting.findMany({
    where: meetingsWhere,
    select: { id: true, meetingTime: true, durationMinutes: true },
  });

  for (const meeting of scheduledMeetings) {
    const existingStart = meeting.meetingTime.getTime();
    const existingEnd = existingStart + meeting.durationMinutes * 60 * 1000;
    if (start < existingEnd && end > existingStart) {
      throw new AppError(
        `Employee already has a scheduled meeting at this time (meeting #${meeting.id}). Please choose another time or employee.`,
        409
      );
    }
  }
}

export interface GetAvailabilityParams {
  companyId: number;
  startTime: Date;
  durationMinutes: number;
  excludeCallId?: number;
  excludeMeetingId?: number;
}

/**
 * Returns employee IDs that are busy (have a Scheduled call or meeting overlapping the slot).
 */
export async function getBusyEmployeeIds(params: GetAvailabilityParams): Promise<number[]> {
  const { companyId, startTime, durationMinutes, excludeCallId, excludeMeetingId } = params;
  const start = startTime.getTime();
  const end = start + durationMinutes * 60 * 1000;
  const busyIds = new Set<number>();

  const callsWhere: Parameters<typeof prisma.leadCall.findMany>[0]['where'] = {
    companyId,
    status: 'Scheduled',
  };
  if (excludeCallId != null) {
    callsWhere.id = { not: excludeCallId };
  }

  const scheduledCalls = await prisma.leadCall.findMany({
    where: callsWhere,
    select: { assignedTo: true, callTime: true, durationMinutes: true },
  });

  for (const call of scheduledCalls) {
    const callDuration = call.durationMinutes ?? CALL_DEFAULT_DURATION_MINUTES;
    const existingStart = call.callTime.getTime();
    const existingEnd = existingStart + callDuration * 60 * 1000;
    if (start < existingEnd && end > existingStart) {
      busyIds.add(call.assignedTo);
    }
  }

  const meetingsWhere: Parameters<typeof prisma.leadMeeting.findMany>[0]['where'] = {
    companyId,
    status: 'Scheduled',
  };
  if (excludeMeetingId != null) {
    meetingsWhere.id = { not: excludeMeetingId };
  }

  const scheduledMeetings = await prisma.leadMeeting.findMany({
    where: meetingsWhere,
    select: { assignedTo: true, meetingTime: true, durationMinutes: true },
  });

  for (const meeting of scheduledMeetings) {
    const existingStart = meeting.meetingTime.getTime();
    const existingEnd = existingStart + meeting.durationMinutes * 60 * 1000;
    if (start < existingEnd && end > existingStart) {
      busyIds.add(meeting.assignedTo);
    }
  }

  return Array.from(busyIds);
}
