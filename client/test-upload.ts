import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const baseUrl = process.argv[2] || 'http://localhost:5001/api';
// The problem is on the live server. So I will test the live server directly to get the 500.
// But wait, the live server is https://imoics.com/api
// I need a user login.

async function testUpload() {
    try {
        const email = 'marzansheikh3698@gmail.com'; // Adjust to a valid test user or admin
        const password = 'password'; // Or whatever local password is used

        console.log(`Testing upload against: ${baseUrl}`);

        // First, login to get a token
        let token, companyId, userId;
        try {
            const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                email: 'admin@imoics.com', // Try default admin
                password: 'password123'
            });
            token = loginRes.data.data.token;
            companyId = loginRes.data.data.user.companyId;
            userId = loginRes.data.data.user.id;
            console.log('Logged in successfully!');
        } catch (e: any) {
            console.log('Login failed:', e.response?.data || e.message);
            return;
        }

        // Now, let's create a task or use task 13
        const taskId = 13;

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
    }
}

testUpload();
