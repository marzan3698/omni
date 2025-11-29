import { Request, Response } from 'express';
import { exampleService } from '../services/example.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const exampleController = {
  getExample: async (req: Request, res: Response) => {
    try {
      const data = await exampleService.getExampleData();
      return sendSuccess(res, data, 'Example data retrieved successfully');
    } catch (error) {
      return sendError(res, (error as Error).message, 500);
    }
  },
};

