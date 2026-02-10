import { prisma } from '../lib/prisma.js';

/** Activity score: min(100, mouseClicks*2 + mouseMovements*0.1 + keystrokes*1.5) */
function computeActivityScore(
  mouseClicks: number,
  mouseMovements: number,
  keystrokes: number
): number {
  const raw =
    mouseClicks * 2 + mouseMovements * 0.1 + keystrokes * 1.5;
  return Math.min(100, Math.round(raw));
}

export interface LogActivityInput {
  mouseClicks: number;
  mouseMovements: number;
  keystrokes: number;
  intervalStart: string;
  intervalEnd: string;
  sessionId?: number | null;
}

export interface EmployeeSummary {
  userId: string;
  name: string | null;
  email: string;
  roleName: string;
  totalActiveMinutes: number;
  avgActivityScore: number;
  screenshotCount: number;
  isOnline: boolean;
}

export interface EmployeeDetail {
  user: { id: string; name: string | null; email: string; roleName: string };
  totalWorkMinutes: number;
  totalActiveMinutes: number;
  avgActivityScore: number;
  screenshotCount: number;
  activityByBlock: { blockStart: string; score: number; label: string }[];
  screenshots: { id: number; imageUrl: string; pageUrl: string | null; capturedAt: string }[];
}

export async function logActivity(
  userId: string,
  companyId: number,
  data: LogActivityInput
): Promise<void> {
  const score = computeActivityScore(
    data.mouseClicks,
    data.mouseMovements,
    data.keystrokes
  );
  await prisma.activityLog.create({
    data: {
      userId,
      companyId,
      sessionId: data.sessionId ?? null,
      mouseClicks: data.mouseClicks,
      mouseMovements: data.mouseMovements,
      keystrokes: data.keystrokes,
      activityScore: score,
      intervalStart: new Date(data.intervalStart),
      intervalEnd: new Date(data.intervalEnd),
    },
  });
}

export async function saveScreenshot(
  userId: string,
  companyId: number,
  imageUrl: string,
  pageUrl: string | null,
  sessionId: number | null
): Promise<{ id: number }> {
  const capture = await prisma.screenCapture.create({
    data: {
      userId,
      companyId,
      sessionId,
      imageUrl,
      pageUrl,
      capturedAt: new Date(),
    },
  });
  return { id: capture.id };
}

export async function getEmployeeSummaries(
  dateStr: string,
  callerCompanyId: number
): Promise<EmployeeSummary[]> {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const users = await prisma.user.findMany({
    where: { companyId: callerCompanyId },
    select: {
      id: true,
      name: true,
      email: true,
      isOnline: true,
      role: { select: { name: true } },
    },
  });

  const summaries: EmployeeSummary[] = [];
  for (const u of users) {
    const [logs, screenshots] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId: u.id,
          companyId: callerCompanyId,
          intervalStart: { gte: date, lt: nextDay },
        },
        select: { activityScore: true, intervalStart: true, intervalEnd: true },
      }),
      prisma.screenCapture.count({
        where: {
          userId: u.id,
          companyId: callerCompanyId,
          capturedAt: { gte: date, lt: nextDay },
        },
      }),
    ]);

    const totalActiveMinutes = logs.length;
    const avgScore =
      logs.length > 0
        ? Math.round(
            logs.reduce((s, l) => s + l.activityScore, 0) / logs.length
          )
        : 0;

    summaries.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      roleName: u.role.name,
      totalActiveMinutes,
      avgActivityScore: avgScore,
      screenshotCount: screenshots,
      isOnline: u.isOnline,
    });
  }

  return summaries;
}

export async function getEmployeeDetail(
  userId: string,
  dateStr: string,
  callerCompanyId: number
): Promise<EmployeeDetail | null> {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: callerCompanyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
    },
  });
  if (!user) return null;

  const [logs, screenshots] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        userId,
        companyId: callerCompanyId,
        intervalStart: { gte: date, lt: nextDay },
      },
      orderBy: { intervalStart: 'asc' },
      select: { intervalStart: true, intervalEnd: true, activityScore: true },
    }),
    prisma.screenCapture.findMany({
      where: {
        userId,
        companyId: callerCompanyId,
        capturedAt: { gte: date, lt: nextDay },
      },
      orderBy: { capturedAt: 'asc' },
      select: { id: true, imageUrl: true, pageUrl: true, capturedAt: true },
    }),
  ]);

  const blockMinutes = 10;
  const blocks: { blockStart: string; score: number; label: string }[] = [];
  const dayStart = date.getTime();
  const dayEnd = nextDay.getTime();
  for (let t = dayStart; t < dayEnd; t += blockMinutes * 60 * 1000) {
    const blockStart = new Date(t);
    const blockEnd = new Date(t + blockMinutes * 60 * 1000);
    const inBlock = logs.filter(
      (l) =>
        l.intervalStart.getTime() >= blockStart.getTime() &&
        l.intervalStart.getTime() < blockEnd.getTime()
    );
    const score =
      inBlock.length > 0
        ? Math.round(
            inBlock.reduce((s, l) => s + l.activityScore, 0) / inBlock.length
          )
        : 0;
    let label = 'Offline';
    if (score > 0) {
      if (score <= 20) label = 'Idle';
      else if (score <= 50) label = 'Low';
      else if (score <= 80) label = 'Active';
      else label = 'Very active';
    }
    blocks.push({
      blockStart: blockStart.toISOString(),
      score,
      label,
    });
  }

  const totalWorkMinutes = logs.length;
  const avgActivityScore =
    logs.length > 0
      ? Math.round(
          logs.reduce((s, l) => s + l.activityScore, 0) / logs.length
        )
      : 0;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleName: user.role.name,
    },
    totalWorkMinutes,
    totalActiveMinutes: totalWorkMinutes,
    avgActivityScore,
    screenshotCount: screenshots.length,
    activityByBlock: blocks,
    screenshots: screenshots.map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl,
      pageUrl: s.pageUrl,
      capturedAt: s.capturedAt.toISOString(),
    })),
  };
}

const SCREENSHOTS_PAGE_SIZE = 20;

export async function getEmployeeScreenshots(
  userId: string,
  dateStr: string,
  page: number,
  callerCompanyId: number
): Promise<{
  screenshots: { id: number; imageUrl: string; pageUrl: string | null; capturedAt: string }[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const [items, total] = await Promise.all([
    prisma.screenCapture.findMany({
      where: {
        userId,
        companyId: callerCompanyId,
        capturedAt: { gte: date, lt: nextDay },
      },
      orderBy: { capturedAt: 'desc' },
      skip: (page - 1) * SCREENSHOTS_PAGE_SIZE,
      take: SCREENSHOTS_PAGE_SIZE,
      select: { id: true, imageUrl: true, pageUrl: true, capturedAt: true },
    }),
    prisma.screenCapture.count({
      where: {
        userId,
        companyId: callerCompanyId,
        capturedAt: { gte: date, lt: nextDay },
      },
    }),
  ]);

  return {
    screenshots: items.map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl,
      pageUrl: s.pageUrl,
      capturedAt: s.capturedAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / SCREENSHOTS_PAGE_SIZE),
  };
}
