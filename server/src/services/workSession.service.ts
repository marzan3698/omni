import { prisma } from '../lib/prisma.js';

export interface WorkSessionResult {
  id: number;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
}

export interface CurrentSessionResponse {
  isOnline: boolean;
  session: WorkSessionResult | null;
}

export interface WorkHistoryResponse {
  sessions: WorkSessionResult[];
  totalDuration: number;
  dailyStats: { date: string; duration: number }[];
}

/**
 * Toggle live status: if online -> go offline (end session); if offline -> go online (start session).
 */
export async function toggleLiveStatus(
  userId: string,
  companyId: number
): Promise<CurrentSessionResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnline: true },
  });
  if (!user) {
    return { isOnline: false, session: null };
  }

  const now = new Date();

  if (user.isOnline) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isOnline: false, lastOnlineAt: now },
      });
      const active = await tx.workSession.findFirst({
        where: { userId, endTime: null },
        orderBy: { startTime: 'desc' },
      });
      if (active) {
        const duration = Math.floor((now.getTime() - active.startTime.getTime()) / 1000);
        await tx.workSession.update({
          where: { id: active.id },
          data: { endTime: now, duration },
        });
      }
    });
    return { isOnline: false, session: null };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true, lastOnlineAt: now },
  });

  const session = await prisma.workSession.create({
    data: {
      userId,
      companyId,
      startTime: now,
    },
  });

  return {
    isOnline: true,
    session: {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
    },
  };
}

/**
 * Get current session status and active session if any.
 */
export async function getCurrentSession(userId: string): Promise<CurrentSessionResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnline: true },
  });
  if (!user) return { isOnline: false, session: null };

  if (!user.isOnline) {
    return { isOnline: false, session: null };
  }

  const session = await prisma.workSession.findFirst({
    where: { userId, endTime: null },
    orderBy: { startTime: 'desc' },
  });

  if (!session) {
    return { isOnline: true, session: null };
  }

  return {
    isOnline: true,
    session: {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
    },
  };
}

/**
 * Get work session history for the user, with optional days (default 7).
 */
export async function getWorkHistory(
  userId: string,
  companyId: number,
  days: number = 7
): Promise<WorkHistoryResponse> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const sessions = await prisma.workSession.findMany({
    where: { userId, companyId, startTime: { gte: since } },
    orderBy: { startTime: 'desc' },
  });

  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);

  const byDate = new Map<string, number>();
  for (const s of sessions) {
    if (s.duration == null) continue;
    const dateKey = s.startTime.toISOString().slice(0, 10);
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + s.duration);
  }
  const dailyStats = Array.from(byDate.entries()).map(([date, duration]) => ({
    date,
    duration,
  }));

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
    })),
    totalDuration,
    dailyStats,
  };
}
