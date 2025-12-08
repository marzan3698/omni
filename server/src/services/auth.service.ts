import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface RegisterData {
  email: string;
  password: string;
  roleId?: number;
  companyId: number;
}

interface RegisterClientData {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  id: string;
  email: string;
  roleId: number;
  companyId: number;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    const { email, password, roleId = 2, companyId } = data; // Default roleId 2 (assuming Employee role)

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Check if user already exists in this company
    const existingUser = await prisma.user.findUnique({
      where: {
        email_companyId: {
          email: email.toLowerCase(),
          companyId,
        },
      },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists in this company', 400);
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new AppError('Invalid role specified', 400);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        roleId,
        companyId,
      },
      include: {
        role: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * Register a new client
   */
  async registerClient(data: RegisterClientData) {
    const { email, password } = data;

    // Get default company (companyId = 1)
    const defaultCompany = await prisma.company.findUnique({
      where: { id: 1 },
    });

    if (!defaultCompany) {
      throw new AppError('Default company not found', 404);
    }

    // Get or create Client role
    let clientRole = await prisma.role.findUnique({
      where: { name: 'Client' },
    });

    if (!clientRole) {
      // Create Client role if it doesn't exist
      clientRole = await prisma.role.create({
        data: {
          name: 'Client',
          permissions: {
            can_view_own_projects: true,
            can_view_campaign_leads: true,
            can_create_projects: true,
            can_delete_users: false,
            can_edit_users: false,
            can_view_users: false,
            can_reply_social: false,
            can_manage_roles: false,
            can_view_reports: false,
            can_manage_finance: false,
            can_manage_companies: false,
            can_manage_employees: false,
            can_manage_tasks: false,
            can_manage_leads: false,
            can_manage_inbox: false,
            can_view_companies: false,
            can_view_employees: false,
            can_view_tasks: false,
            can_view_leads: false,
            can_view_finance: false,
            can_create_leads: false,
          },
        },
      });
    }

    // Check if user already exists in this company
    const existingUser = await prisma.user.findUnique({
      where: {
        email_companyId: {
          email: email.toLowerCase(),
          companyId: defaultCompany.id,
        },
      },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with Client role
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        roleId: clientRole.id,
        companyId: defaultCompany.id,
      },
      include: {
        role: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * Login user
   */
  async login(data: LoginData) {
    const { email, password } = data;

    // Find user by email (need to search across companies)
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        role: true,
        company: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.company.isActive) {
      throw new AppError('Company account is inactive', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        companyId: user.companyId,
        roleName: user.role.name,
        permissions: user.role.permissions,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Optionally fetch employee if it exists
    let employee = null;
    try {
      const employeeData = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: {
          departmentRelation: true,
        },
      });
      employee = employeeData;
    } catch (error) {
      // Employee doesn't exist, which is fine
      employee = null;
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
      roleName: user.role.name,
      permissions: (user.role.permissions as Record<string, boolean>) || {},
      profileImage: user.profileImage,
      employee: employee,
      createdAt: user.createdAt,
    };
  },

  /**
   * Generate JWT token
   */
  generateToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }

    return jwt.sign(payload, secret, { expiresIn });
  },

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }

    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  },
};

