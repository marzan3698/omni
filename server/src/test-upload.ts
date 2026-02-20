import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';

const baseUrl = 'http://localhost:5001/api';
const prisma = new PrismaClient();

async function testUpload() {
    try {
        const employee = await prisma.employee.findFirst({
            include: { user: true }
        });

        if (!employee || !employee.user) {
            console.error('No employee found');
            return;
        }

        const userId = employee.user.id;
        const companyId = employee.companyId;
        const jwtSecret = 'your-super-secret-jwt-key-change-in-production-min-32-chars';

        // Forge JWT token
        const token = jwt.sign(
            { id: userId, email: employee.user.email, role: 'Admin', companyId },
            jwtSecret,
            { expiresIn: '1h' }
        );

        console.log(`Testing upload against: ${baseUrl} as ${employee.user.email}`);

        const task = await prisma.task.findFirst({ where: { companyId } });
        const taskId = task?.id;

        if (!taskId) {
            console.error('No task found');
            return;
        }

        // Create a dummy file
        const filePath = './test-image.png';
        fs.writeFileSync(filePath, 'dummy image content');

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('companyId', companyId);

        console.log(`Uploading to /tasks/${taskId}/attachments...`);
        try {
            const uploadRes = await axios.post(
                `${baseUrl}/tasks/${taskId}/attachments`,
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log('Upload success:', uploadRes.data);
        } catch (uploadError: any) {
            console.error('Upload failed with status:', uploadError.response?.status);
            console.error('Error details:', uploadError.response?.data);
            if (uploadError.response?.data?.message) {
                console.error('Exact error message:', uploadError.response.data.message);
            }
        }

        // Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUpload();
