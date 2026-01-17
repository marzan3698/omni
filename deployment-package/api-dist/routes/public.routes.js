import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = Router();
/**
 * Privacy Policy Page
 * GET /privacy-policy
 */
router.get('/privacy-policy', async (req, res) => {
    try {
        // Path to docs folder (one level up from server)
        const privacyPolicyPath = join(__dirname, '../../../docs/privacy-policy.md');
        const content = await readFile(privacyPolicyPath, 'utf-8');
        // Convert markdown to HTML (simple conversion)
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Omni CRM</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #4f46e5;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e293b;
            margin-top: 30px;
        }
        h3 {
            color: #475569;
            margin-top: 20px;
        }
        p {
            margin: 15px 0;
        }
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        li {
            margin: 8px 0;
        }
        strong {
            color: #1e293b;
        }
        .last-updated {
            color: #64748b;
            font-style: italic;
            margin-bottom: 30px;
        }
        a {
            color: #4f46e5;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
            .replace(/<p>---<\/p>/g, '<hr>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
            .replace(/<p>(\d+\.\s)/g, '<p><strong>$1</strong>')
            .replace(/<p>(-|\*)\s/g, '<p>• ')}
    </div>
</body>
</html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        console.error('Error serving privacy policy:', error);
        res.status(500).send('Error loading privacy policy');
    }
});
/**
 * Terms of Service Page
 * GET /terms-of-service
 */
router.get('/terms-of-service', async (req, res) => {
    try {
        // Path to docs folder (one level up from server)
        const termsPath = join(__dirname, '../../../docs/terms-of-service.md');
        const content = await readFile(termsPath, 'utf-8');
        // Convert markdown to HTML (simple conversion)
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Omni CRM</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #4f46e5;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e293b;
            margin-top: 30px;
        }
        h3 {
            color: #475569;
            margin-top: 20px;
        }
        p {
            margin: 15px 0;
        }
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        li {
            margin: 8px 0;
        }
        strong {
            color: #1e293b;
        }
        .last-updated {
            color: #64748b;
            font-style: italic;
            margin-bottom: 30px;
        }
        a {
            color: #4f46e5;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
            .replace(/<p>---<\/p>/g, '<hr>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
            .replace(/<p>(\d+\.\d+\.\d+\s)/g, '<p><strong>$1</strong>')
            .replace(/<p>(\d+\.\d+\s)/g, '<p><strong>$1</strong>')
            .replace(/<p>(\d+\.\s)/g, '<p><strong>$1</strong>')}
    </div>
</body>
</html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        console.error('Error serving terms of service:', error);
        res.status(500).send('Error loading terms of service');
    }
});
/**
 * User Data Deletion Callback
 * GET /user-data-deletion
 * This endpoint is required by Facebook for user data deletion requests
 */
router.get('/user-data-deletion', async (req, res) => {
    try {
        // Facebook sends confirmation_code in query params
        const confirmationCode = req.query.confirmation_code;
        const signedRequest = req.query.signed_request;
        // If confirmation_code is provided, this is a deletion confirmation
        if (confirmationCode) {
            // In a real implementation, you would:
            // 1. Verify the confirmation_code
            // 2. Delete the user's data from your database
            // 3. Return a confirmation response
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Deletion - Omni CRM</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 { color: #4f46e5; }
        .success { color: #10b981; font-size: 48px; margin: 20px 0; }
        p { color: #64748b; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✓</div>
        <h1>Data Deletion Request Received</h1>
        <p>Your data deletion request has been received.</p>
        <p>Confirmation Code: <strong>${confirmationCode}</strong></p>
        <p>Your data will be deleted within 30 days as per our privacy policy.</p>
    </div>
</body>
</html>
      `;
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        }
        // Initial deletion request page
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Data Deletion - Omni CRM</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 30px; }
        p { margin: 15px 0; color: #475569; }
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
        }
        .steps {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .step {
            margin: 15px 0;
            padding-left: 30px;
        }
        .step-number {
            background: #4f46e5;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>User Data Deletion Request</h1>
        
        <div class="info-box">
            <p><strong>Your Right to Data Deletion</strong></p>
            <p>You have the right to request deletion of your personal data from Omni CRM. This page explains how to submit a data deletion request.</p>
        </div>

        <h2>How to Request Data Deletion</h2>
        
        <div class="steps">
            <div class="step">
                <span class="step-number">1</span>
                <strong>Contact Us</strong>
                <p>Send an email to <a href="mailto:privacy@omnicrm.com">privacy@omnicrm.com</a> with the subject "Data Deletion Request"</p>
            </div>
            
            <div class="step">
                <span class="step-number">2</span>
                <strong>Provide Information</strong>
                <p>Include your account email address and Facebook Page ID (if applicable) in your request</p>
            </div>
            
            <div class="step">
                <span class="step-number">3</span>
                <strong>Verification</strong>
                <p>We will verify your identity before processing the deletion request</p>
            </div>
            
            <div class="step">
                <span class="step-number">4</span>
                <strong>Deletion</strong>
                <p>Your data will be permanently deleted within 30 days of verification</p>
            </div>
        </div>

        <h2>What Data Will Be Deleted?</h2>
        <ul>
            <li>Your account information (email, profile data)</li>
            <li>Facebook integration settings (Page ID, access tokens)</li>
            <li>Conversations and messages associated with your account</li>
            <li>All other personal data stored in our system</li>
        </ul>

        <h2>Contact Information</h2>
        <p><strong>Email:</strong> <a href="mailto:privacy@omnicrm.com">privacy@omnicrm.com</a></p>
        <p><strong>Website:</strong> <a href="https://journee-mechanomorphic-soledad.ngrok-free.dev">Omni CRM</a></p>

        <div class="info-box" style="margin-top: 30px;">
            <p><strong>Note:</strong> Some data may be retained for legal or regulatory purposes as required by law.</p>
        </div>
    </div>
</body>
</html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        console.error('Error serving user data deletion page:', error);
        res.status(500).send('Error loading data deletion page');
    }
});
export default router;
//# sourceMappingURL=public.routes.js.map