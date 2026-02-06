import { prisma } from '../lib/prisma.js';

export interface AssignmentStats {
  totalConversations: number;
  whatsappCount: number;
  messengerCount: number;
  assignedToMe: number;
  totalCustomerCareReps: number;
  myShare: number;
}

/**
 * Get all active Customer Care employees for a company (sorted by id for consistent tie-breaker).
 */
export async function getCustomerCareEmployees(companyId: number) {
  const role = await prisma.role.findFirst({
    where: { name: 'Customer Care' },
  });
  if (!role) return [];

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      user: {
        roleId: role.id,
        isOnline: true,
      },
    },
    orderBy: { id: 'asc' },
  });
  return employees;
}

/**
 * Get next assignee using least-loaded: employee with fewest open conversations (tie: lowest ID).
 * Returns null if no Customer Care employees.
 */
export async function getNextAssignee(companyId: number) {
  const employees = await getCustomerCareEmployees(companyId);
  if (employees.length === 0) return null;

  const counts = await prisma.socialConversation.groupBy({
    by: ['assignedTo'],
    where: {
      companyId,
      status: 'Open',
      assignedTo: { in: employees.map((e) => e.id) },
    },
    _count: { id: true },
  });

  const countMap = new Map<number, number>();
  for (const c of counts) {
    if (c.assignedTo != null) {
      countMap.set(c.assignedTo, c._count.id);
    }
  }

  let leastLoaded = employees[0];
  let minCount = countMap.get(employees[0].id) ?? 0;

  for (const emp of employees) {
    const count = countMap.get(emp.id) ?? 0;
    if (count < minCount) {
      minCount = count;
      leastLoaded = emp;
    }
  }

  return leastLoaded;
}

/**
 * Auto-assign a conversation to the least-loaded Customer Care rep.
 * Only assigns if the conversation exists, belongs to company, and is currently unassigned.
 */
export async function autoAssignConversation(
  conversationId: number,
  companyId: number
): Promise<void> {
  const conversation = await prisma.socialConversation.findFirst({
    where: { id: conversationId, companyId },
  });
  if (!conversation || conversation.assignedTo != null) return;

  const assignee = await getNextAssignee(companyId);
  if (!assignee) return;

  await prisma.socialConversation.update({
    where: { id: conversationId },
    data: {
      assignedTo: assignee.id,
      assignedAt: new Date(),
    },
  });
}

/**
 * Get assignment stats for the inbox dashboard (optionally for a specific employee).
 */
export async function getAssignmentStats(
  companyId: number,
  employeeId?: number
): Promise<AssignmentStats> {
  const [total, whatsapp, messenger, assignedToMe, reps] = await Promise.all([
    prisma.socialConversation.count({
      where: { companyId, status: 'Open' },
    }),
    prisma.socialConversation.count({
      where: { companyId, status: 'Open', platform: 'whatsapp' },
    }),
    prisma.socialConversation.count({
      where: { companyId, status: 'Open', platform: 'facebook' },
    }),
    employeeId
      ? prisma.socialConversation.count({
          where: {
            companyId,
            status: 'Open',
            assignedTo: employeeId,
          },
        })
      : 0,
    getCustomerCareEmployees(companyId).then((arr) => arr.length),
  ]);

  const myShare = reps > 0 ? Math.round(total / reps) : 0;
  return {
    totalConversations: total,
    whatsappCount: whatsapp,
    messengerCount: messenger,
    assignedToMe,
    totalCustomerCareReps: reps,
    myShare,
  };
}

export interface SuperAdminStats {
  totalMessages: number;
  assignedMessages: number;
  unassignedMessages: number;
  activeRepsCount: number;
}

/**
 * Get stats for SuperAdmin inbox dashboard (Open conversations only).
 */
export async function getSuperAdminStats(companyId: number): Promise<SuperAdminStats> {
  const [totalMessages, assignedMessages, reps] = await Promise.all([
    prisma.socialConversation.count({
      where: { companyId, status: 'Open' },
    }),
    prisma.socialConversation.count({
      where: { companyId, status: 'Open', assignedTo: { not: null } },
    }),
    getCustomerCareEmployees(companyId).then((arr) => arr.length),
  ]);
  const unassignedMessages = totalMessages - assignedMessages;
  return {
    totalMessages,
    assignedMessages,
    unassignedMessages,
    activeRepsCount: reps,
  };
}

/**
 * Distribute up to N unassigned Open conversations to active Customer Care reps (least-loaded).
 * Returns counts of successfully distributed and failed (e.g. no assignee).
 */
export async function distributeUnassignedConversations(
  companyId: number,
  count: number
): Promise<{ distributed: number; failed: number }> {
  const limit = Math.min(Math.max(1, count), 100);
  const conversations = await prisma.socialConversation.findMany({
    where: { companyId, status: 'Open', assignedTo: null },
    orderBy: [{ lastMessageAt: 'asc' }, { createdAt: 'asc' }],
    take: limit,
    select: { id: true },
  });
  let distributed = 0;
  let failed = 0;
  for (const conv of conversations) {
    const before = await prisma.socialConversation.findUnique({
      where: { id: conv.id },
      select: { assignedTo: true },
    });
    await autoAssignConversation(conv.id, companyId);
    const after = await prisma.socialConversation.findUnique({
      where: { id: conv.id },
      select: { assignedTo: true },
    });
    if (after?.assignedTo != null && (before?.assignedTo ?? null) !== after.assignedTo) {
      distributed += 1;
    } else {
      failed += 1;
    }
  }
  return { distributed, failed };
}
