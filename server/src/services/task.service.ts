import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { TaskPriority, TaskStatus } from '@prisma/client';

interface CreateTaskData {
  companyId: number;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: number;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: number;
  status?: TaskStatus;
}

interface CreateTaskCommentData {
  taskId: number;
  userId: string;
  content: string;
}

export const taskService = {
  /**
   * Get all tasks for a company
   */
  async getAllTasks(companyId: number, filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: number;
  }) {
    return await prisma.task.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get task by ID
   */
  async getTaskById(id: number, companyId: number) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  },

  /**
   * Create task
   */
  async createTask(data: CreateTaskData) {
    // Verify assigned employee if provided
    if (data.assignedTo) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.assignedTo,
          companyId: data.companyId,
        },
      });

      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
    }

    return await prisma.task.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'Medium',
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Update task
   */
  async updateTask(id: number, companyId: number, data: UpdateTaskData) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Verify assigned employee if provided
    if (data.assignedTo) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.assignedTo,
          companyId,
        },
      });

      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
    }

    return await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Delete task
   */
  async deleteTask(id: number, companyId: number) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return await prisma.task.delete({
      where: { id },
    });
  },

  /**
   * Update task status
   */
  async updateTaskStatus(id: number, companyId: number, status: TaskStatus) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Add task comment
   */
  async addTaskComment(data: CreateTaskCommentData) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return await prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });
  },

  /**
   * Get task comments
   */
  async getTaskComments(taskId: number) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get tasks assigned to a specific user (for dashboard)
   */
  async getUserTasks(userId: string, companyId: number) {
    // Find employee for this user
    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    if (!employee) {
      return []; // User has no employee record, so no tasks
    }

    return await prisma.task.findMany({
      where: {
        companyId,
        assignedTo: employee.id,
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        comments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Todo first, then InProgress, then Done
        { dueDate: 'asc' }, // Then by due date
        { createdAt: 'desc' }, // Then by creation date
      ],
    });
  },

  /**
   * Assign task to user (SuperAdmin can assign to any employee)
   */
  async assignTaskToUser(taskId: number, employeeId: number, companyId: number) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Verify employee exists (SuperAdmin can assign to any employee in the company)
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: { assignedTo: employeeId },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
};

