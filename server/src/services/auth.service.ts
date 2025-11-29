import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface RegisterData {
  email: string;
  password: string;
  roleId?: number;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  id: string;
  email: string;
  roleId: number;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    const { email, password, roleId = 2 } = data; // Default roleId 2 (assuming Employee role)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
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
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: {
          include: {
            departmentRelation: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions,
      profileImage: user.profileImage,
      employee: user.employee,
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

