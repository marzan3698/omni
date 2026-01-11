import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { TaskStatus } from '@prisma/client';
import { taskService } from './task.service.js';

interface CreateSubTaskData {
  taskId: number;
  companyId: number;
  title: string;
  instructions?: string;
  weight?: number;
  order?: number;
}

interface UpdateSubTaskData {
  title?: string;
  instructions?: string;
  weight?: number;
  order?: number;
  status?: TaskStatus;
}

export const subTaskService = {
  /**
   * Create sub-task
   */
  async createSubTask(data: CreateSubTaskData) {
    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        companyId: data.companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Get the highest order value for sub-tasks in this task
    const maxOrder = await prisma.subTask.findFirst({
      where: {
        taskId: data.taskId,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const newOrder = data.order !== undefined ? data.order : (maxOrder?.order ?? -1) + 1;

    const subTask = await prisma.subTask.create({
      data: {
        taskId: data.taskId,
        companyId: data.companyId,
        title: data.title,
        instructions: data.instructions,
        weight: data.weight ?? 1.0,
        order: newOrder,
        status: 'Pending',
      },
      include: {
        attachments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Recalculate task progress
    await this.calculateTaskProgress(data.taskId, data.companyId);

    return subTask;
  },

  /**
   * Update sub-task
   */
  async updateSubTask(id: number, companyId: number, data: UpdateSubTaskData) {
    const subTask = await prisma.subTask.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!subTask) {
      throw new AppError('Sub-task not found', 404);
    }

    const updateData: any = { ...data };

    // If status is being updated to StartedWorking, set startedAt
    if (data.status === 'StartedWorking' && subTask.status === 'Pending' && !subTask.startedAt) {
      updateData.startedAt = new Date();
    }

    // If status is being updated to Complete, set completedAt
    if (data.status === 'Complete' && subTask.status !== 'Complete') {
      updateData.completedAt = new Date();
    }

    // If status is being updated from Complete, clear completedAt
    if (data.status && data.status !== 'Complete' && subTask.status === 'Complete') {
      updateData.completedAt = null;
    }

    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: updateData,
      include: {
        attachments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Recalculate task progress
    await this.calculateTaskProgress(subTask.taskId, companyId);

    return updatedSubTask;
  },

  /**
   * Delete sub-task
   */
  async deleteSubTask(id: number, companyId: number) {
    const subTask = await prisma.subTask.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!subTask) {
      throw new AppError('Sub-task not found', 404);
    }

    const taskId = subTask.taskId;

    await prisma.subTask.delete({
      where: { id },
    });

    // Recalculate task progress
    await this.calculateTaskProgress(taskId, companyId);

    return { success: true };
  },

  /**
   * Get all sub-tasks for a task
   */
  async getSubTasksByTaskId(taskId: number, companyId: number) {
    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const subTasks = await prisma.subTask.findMany({
      where: {
        taskId,
        companyId,
      },
      include: {
        attachments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return subTasks;
  },

  /**
   * Calculate weighted progress for a task based on sub-tasks
   * Formula: Sum of (sub-task weight * completion percentage) / Total weight
   */
  async calculateTaskProgress(taskId: number, companyId: number): Promise<number> {
    const subTasks = await prisma.subTask.findMany({
      where: {
        taskId,
        companyId,
      },
      select: {
        id: true,
        weight: true,
        status: true,
      },
    });

    if (subTasks.length === 0) {
      // No sub-tasks, progress remains as set (or 0)
      return 0;
    }

    let totalWeight = 0;
    let completedWeight = 0;

    for (const subTask of subTasks) {
      const weight = Number(subTask.weight);
      totalWeight += weight;

      // Calculate completion percentage based on status
      let completionPercentage = 0;
      switch (subTask.status) {
        case 'Complete':
          completionPercentage = 100;
          break;
        case 'StartedWorking':
          completionPercentage = 50; // Assume 50% progress when started
          break;
        case 'Pending':
          completionPercentage = 0;
          break;
        case 'Cancel':
          completionPercentage = 0; // Canceled tasks don't count towards progress
          break;
      }

      completedWeight += weight * (completionPercentage / 100);
    }

    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    // Update task progress
    await prisma.task.update({
      where: { id: taskId },
      data: {
        progress: progress,
      },
    });

    return progress;
  },
};

