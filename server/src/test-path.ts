import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootUploadsDir = path.join(__dirname, '../../uploads');

console.log("Testing path resolutions:");
console.log("__dirname:", __dirname);
console.log("rootUploadsDir:", rootUploadsDir);

const taskUploadsBaseDir = path.join(rootUploadsDir, 'tasks');
console.log("taskUploadsBaseDir:", taskUploadsBaseDir);

try {
    if (!fs.existsSync(taskUploadsBaseDir)) {
        console.log("Directory does not exist, creating:", taskUploadsBaseDir);
        fs.mkdirSync(taskUploadsBaseDir, { recursive: true });
        console.log("Created successfully.");
    } else {
        console.log("Directory already exists:", taskUploadsBaseDir);
    }
} catch (error) {
    console.error("Error creating directory:", error);
}
