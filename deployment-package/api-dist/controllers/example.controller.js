import { exampleService } from '../services/example.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
export const exampleController = {
    getExample: async (req, res) => {
        try {
            const data = await exampleService.getExampleData();
            return sendSuccess(res, data, 'Example data retrieved successfully');
        }
        catch (error) {
            return sendError(res, error.message, 500);
        }
    },
};
//# sourceMappingURL=example.controller.js.map