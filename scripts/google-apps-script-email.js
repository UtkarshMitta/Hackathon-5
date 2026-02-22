/**
 * MarginGuard AI - Email Notification Service
 * 
 * Google Apps Script Web App for sending HTML emails via GmailApp
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project (+ New project)
 * 3. Copy this entire code into the editor
 * 4. Click "Deploy" → "New deployment"
 * 5. Select type: "Web app"
 * 6. Configuration:
 *    - Description: "MarginGuard AI Email Service"
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone
 * 7. Click "Deploy"
 * 8. Authorize the app (click "Authorize access", select your account, click "Advanced" → "Go to MarginGuard (unsafe)" → "Allow")
 * 9. Copy the Web App URL (looks like: https://script.google.com/macros/s/AK...xyz.../exec)
 * 10. Set this URL as the GAS_EMAIL_WEBHOOK_URL environment variable in Vercel
 * 
 * TESTING:
 * curl -X POST "YOUR_WEB_APP_URL" \
 *   -H "Content-Type: application/json" \
 *   -d '{"to":"your@email.com","subject":"Test","body":"<h1>It Works!</h1><p>Email is configured correctly.</p>"}'
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.to || !data.subject || !data.body) {
      return createJsonResponse({
        success: false,
        error: 'Missing required fields: to, subject, body'
      }, 400);
    }
    
    // Send the email via GmailApp
    GmailApp.sendEmail(data.to, data.subject, '', {
      htmlBody: data.body,
      name: 'MarginGuard AI',
      noReply: false
    });
    
    // Log the sent email for debugging
    Logger.log(`Email sent to: ${data.to}, subject: ${data.subject}`);
    
    // Return success response
    return createJsonResponse({
      success: true,
      message: `Email sent to ${data.to}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Log the error for debugging
    Logger.log(`Error sending email: ${error.toString()}`);
    
    // Return error response
    return createJsonResponse({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Helper function to create JSON responses
 */
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Note: GAS Web Apps don't support HTTP status codes in responses,
  // but we include them in the JSON body for consistency
  if (statusCode !== 200) {
    data.statusCode = statusCode;
  }
  
  return output;
}

/**
 * Test function (optional - can be run from the GAS editor)
 * Click "Run" → select "testEmail" to test sending
 */
function testEmail() {
  const testPayload = {
    to: 'your-email@example.com', // CHANGE THIS TO YOUR EMAIL
    subject: 'MarginGuard AI - Test Email',
    body: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">MarginGuard AI - Email Test</h1>
          <p>This is a test email from your Google Apps Script deployment.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #dc2626; margin-top: 0;">Critical Alert Example</h2>
            <p><strong>Project:</strong> PRJ-2024-001</p>
            <p><strong>Risk Level:</strong> <span style="color: #dc2626;">HIGH</span></p>
            <p><strong>Estimated Impact:</strong> $45,200</p>
          </div>
          <h3>Recommended Actions:</h3>
          <ol>
            <li>Submit change order for additional ductwork</li>
            <li>Document verbal approval in writing</li>
            <li>Bill for completed work on SOV line 04-DUCT</li>
          </ol>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by MarginGuard AI - Autonomous HVAC Portfolio Protection
          </p>
        </body>
      </html>
    `
  };
  
  // Simulate the doPost request
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
