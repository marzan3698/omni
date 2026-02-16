import { prisma } from '../lib/prisma.js';
import * as workSessionService from './workSession.service.js';
import * as activityService from './activity.service.js';

export interface LiveUserItem {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  roleName: string;
  sessionDurationHours: number;
  sessionStartedAt: string | null;
  assignedConversationsCount: number;
  lastOnlineAt: string | null;
}

/**
 * Get all currently live (isOnline) users for the given company.
 * Returns user info plus session duration, assigned conversations, etc.
 */
export async function getLiveUsers(companyId: number): Promise<LiveUserItem[]> {
  const now = new Date();

  const liveUsers = await prisma.user.findMany({
    where: {
      companyId,
      isOnline: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      lastOnlineAt: true,
      role: { select: { name: true } },
      employee: { select: { id: true } },
    },
  });

  const result: LiveUserItem[] = [];

  for (const u of liveUsers) {
    const [activeSession, assignedCount] = await Promise.all([
      prisma.workSession.findFirst({
        where: { userId: u.id, endTime: null },
        orderBy: { startTime: 'desc' },
      }),
      u.employee
        ? prisma.socialConversation.count({
            where: { assignedTo: u.employee.id },
          })
        : Promise.resolve(0),
    ]);

    const sessionDurationSeconds = activeSession
      ? Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000)
      : 0;
    const sessionDurationHours = Math.round((sessionDurationSeconds / 3600) * 10) / 10;

    result.push({
      id: u.id,
      name: u.name,
      email: u.email,
      profileImage: u.profileImage,
      roleName: u.role.name,
      sessionDurationHours,
      sessionStartedAt: activeSession?.startTime.toISOString() ?? null,
      assignedConversationsCount: assignedCount,
      lastOnlineAt: u.lastOnlineAt?.toISOString() ?? null,
    });
  }

  return result;
}

export interface LiveUserDetail {
  user: LiveUserItem;
  workHistory: {
    sessions: { id: number; startTime: string; endTime: string | null; duration: number | null }[];
    totalDuration: number;
    dailyStats: { date: string; duration: number }[];
  };
  activityToday: {
    totalActiveMinutes: number;
    avgActivityScore: number;
    activityByBlock: { blockStart: string; score: number; label: string }[];
    screenshotCount: number;
  } | null;
}

/**
 * Get full detail for a live user (work history, activity today, etc.)
 */
export async function getLiveUserDetail(
  userId: string,
  callerCompanyId: number
): Promise<LiveUserDetail | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: callerCompanyId, isOnline: true },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      lastOnlineAt: true,
      role: { select: { name: true } },
      employee: { select: { id: true } },
    },
  });
  if (!user) return null;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [activeSession, assignedCount, workHistory, activityDetail] = await Promise.all([
    prisma.workSession.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' },
    }),
    user.employee
      ? prisma.socialConversation.count({ where: { assignedTo: user.employee.id } })
      : Promise.resolve(0),
    workSessionService.getWorkHistory(userId, callerCompanyId, 7),
    activityService.getEmployeeDetail(userId, today, callerCompanyId),
  ]);

  const sessionDurationSeconds = activeSession
    ? Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000)
    : 0;
  const sessionDurationHours = Math.round((sessionDurationSeconds / 3600) * 10) / 10;

  const liveUser: LiveUserItem = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    roleName: user.role.name,
    sessionDurationHours,
    sessionStartedAt: activeSession?.startTime.toISOString() ?? null,
    assignedConversationsCount: assignedCount,
    lastOnlineAt: user.lastOnlineAt?.toISOString() ?? null,
  };

  return {
    user: liveUser,
    workHistory: {
      sessions: workHistory.sessions.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString() ?? null,
        duration: s.duration,
      })),
      totalDuration: workHistory.totalDuration,
      dailyStats: workHistory.dailyStats,
    },
    activityToday: activityDetail
      ? {
          totalActiveMinutes: activityDetail.totalActiveMinutes,
          avgActivityScore: activityDetail.avgActivityScore,
          activityByBlock: activityDetail.activityByBlock,
          screenshotCount: activityDetail.screenshotCount,
        }
      : null,
  };
}
