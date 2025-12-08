import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ProjectData {
  id: number;
  title: string;
  description?: string | null;
  budget: number;
  time: string;
  createdAt: Date;
  clientId: string;
}

/**
 * Generate PDF document for project requirements
 */
export async function generateProjectPDF(project: ProjectData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'projects');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate filename
      const filename = `project-${project.id}-${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add content
      doc.fontSize(20).text('Project Requirements Document', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('Project Details', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12);
      doc.text(`Project ID: ${project.id}`);
      doc.text(`Title: ${project.title}`);
      doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      if (project.description) {
        doc.fontSize(14).text('Description', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(project.description, {
          align: 'left',
        });
        doc.moveDown();
      }

      doc.fontSize(14).text('Requirements', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Budget: $${project.budget.toLocaleString()}`);
      doc.text(`Timeframe: ${project.time}`);
      doc.moveDown(2);

      doc.fontSize(14).text('Terms and Conditions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(
        'By signing this document, the client agrees to the project requirements and terms outlined above. ' +
        'The project will commence upon approval and signature.',
        {
          align: 'justify',
        }
      );
      doc.moveDown(2);

      // Add signature section
      doc.fontSize(14).text('Signature Section', { underline: true });
      doc.moveDown(1);
      doc.fontSize(12).text('Client Signature:');
      doc.moveDown(2);
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).text('Date: _______________', { align: 'left' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        // Return relative path for storage in database
        const relativePath = `/uploads/projects/${filename}`;
        resolve(relativePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get PDF file path
 */
export function getProjectPDFPath(documentUrl: string): string {
  return path.join(process.cwd(), documentUrl);
}

