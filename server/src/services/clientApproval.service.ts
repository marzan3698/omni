import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const clientApprovalService = {
  async getPending(companyId: number) {
    return prisma.clientApprovalRequest.findMany({
      where: { companyId, status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
            address: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            title: true,
            customerName: true,
            phone: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                customerPoint: true,
              },
            },
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        requestedByEmployee: {
          select: {
            id: true,
            designation: true,
          },
        },
      },
    });
  },

  async approve(id: number, companyId: number, approvedByUserId: string) {
    const request = await prisma.clientApprovalRequest.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        requestedByEmployee: true,
      },
    });

    if (!request) {
      throw new AppError('Approval request not found', 404);
    }

    if (request.status !== 'Pending') {
      throw new AppError('Request is not pending', 400);
    }

    const customerPoints = Number(request.customerPoints);
    const employeeId = request.requestedByEmployeeId;

    return await prisma.$transaction(async (tx) => {
      await tx.clientApprovalRequest.update({
        where: { id },
        data: {
          status: 'Approved',
          approvedByUserId,
          approvedAt: new Date(),
        },
      });

      await tx.client.update({
        where: { id: request.clientId },
        data: { status: 'Active' },
      });

      const clientRole = await tx.role.findFirst({
        where: { name: 'Client' },
      });
      if (!clientRole) {
        throw new AppError('Client role not found. Please seed roles.', 500);
      }

      const emailLower = request.email.trim().toLowerCase();
      const existingUser = await tx.user.findFirst({
        where: { email: emailLower, companyId },
      });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: request.passwordHash,
            name: request.client.name || existingUser.name,
            phone: (request.client.contactInfo as { phone?: string })?.phone ?? existingUser.phone,
            address: request.client.address ?? existingUser.address,
          },
        });
      } else {
        await tx.user.create({
          data: {
            email: emailLower,
            passwordHash: request.passwordHash,
            roleId: clientRole.id,
            companyId,
            name: request.client.name || null,
            phone: (request.client.contactInfo as { phone?: string })?.phone ?? null,
            address: request.client.address ?? null,
          },
        });
      }

      if (customerPoints > 0) {
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            reservePoints: { decrement: customerPoints },
            mainPoints: { increment: customerPoints },
          },
        });
      }

      return prisma.clientApprovalRequest.findUnique({
        where: { id },
        include: {
          client: true,
          lead: { include: { product: { select: { name: true, customerPoint: true } } } },
        },
      });
    });
  },
};
