# MarginGuard AI - Email Setup Guide

This guide walks you through setting up the Google Apps Script (GAS) email notification system.

## Overview

MarginGuard AI uses Google Apps Script as a webhook to send HTML emails via your Gmail account. This is free, reliable, and requires no third-party email service.

**Why GAS?** Gmail's free tier allows 100 emails/day, more than enough for demos and small teams. Plus, it keeps emails in your sent folder automatically.

---

## Step-by-Step Setup (10 minutes)

### Step 1: Create the Google Apps Script Project

1. **Open Google Apps Script**
   - Go to [https://script.google.com](https://script.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click **"+ New project"** (top left)
   - A new editor window opens with `Code.gs` tab

3. **Replace the default code**
   - Delete all the placeholder code in the editor
   - Open `/vercel/share/v0-project/scripts/google-apps-script-email.js`
   - Copy the entire contents
   - Paste into the GAS editor

4. **Rename the project (optional but recommended)**
   - Click "Untitled project" at the top
   - Rename to "MarginGuard AI Email Service"
   - Click ✓ to save

---

### Step 2: Deploy as Web App

1. **Click "Deploy" button** (top right)
   - Select **"New deployment"**

2. **Configure the deployment**
   - Click the ⚙️ (gear icon) next to "Select type"
   - Choose **"Web app"**
   - Fill in the settings:
     - **Description:** `MarginGuard AI Email Service v1`
     - **Execute as:** `Me (your-email@gmail.com)` ← IMPORTANT
     - **Who has access:** `Anyone` ← IMPORTANT
   - Click **"Deploy"**

3. **Authorize the app**
   - A popup appears: "Authorization required"
   - Click **"Authorize access"**
   - Select your Google account
   - You'll see a warning: "Google hasn't verified this app"
   - Click **"Advanced"** → **"Go to MarginGuard (unsafe)"**
   - Review permissions (it needs to send emails via Gmail)
   - Click **"Allow"**

4. **Copy the Web App URL**
   - After authorization, you'll see a "Deployment" confirmation
   - **Copy the Web App URL** (looks like):
     ```
     https://script.google.com/macros/s/AKfycbx...xyz.../exec
     ```
   - Keep this URL safe - you'll need it in the next step

---

### Step 3: Configure Vercel Environment Variables

1. **Go to your Vercel project**
   - Open [https://vercel.com](https://vercel.com)
   - Navigate to your MarginGuard AI project
   - Go to **Settings** → **Environment Variables**

2. **Add the webhook URL**
   - Click **"Add New"**
   - **Name:** `GAS_EMAIL_WEBHOOK_URL`
   - **Value:** (paste the Web App URL you copied)
   - **Environments:** Check all (Production, Preview, Development)
   - Click **"Save"**

3. **Add the recipient email**
   - Click **"Add New"** again
   - **Name:** `ALERT_EMAIL_TO`
   - **Value:** Your email address (where you want to receive reports)
   - **Environments:** Check all
   - Click **"Save"**

4. **Redeploy your app**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - Wait for deployment to complete

---

### Step 4: Test the Email System

#### Test 1: Direct curl test (from your terminal)

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com","subject":"MarginGuard Test","body":"<h1>Success!</h1><p>GAS email is working.</p>"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Email sent to your@email.com",
  "timestamp": "2024-..."
}
```

**Check your inbox** - you should receive the test email within 5-10 seconds.

#### Test 2: Test from within MarginGuard AI

1. Open your deployed MarginGuard AI app
2. Go to `/agent`
3. Type:
   ```
   Email me a test report with project PRJ-2024-001
   ```
4. The agent will:
   - Investigate the project
   - Compose an HTML email
   - Call `sendEmailReport` tool
   - Send the email via your GAS webhook

5. **Check your inbox** - you should receive a professionally formatted email with:
   - Project details
   - Risk assessment
   - Action items
   - Dollar amounts

---

## Troubleshooting

### Error: "Authorization required"

**Solution:** Re-run the authorization flow:
1. Go back to your GAS project
2. Click "Deploy" → "Manage deployments"
3. Click the ⚙️ next to your deployment
4. Change "Who has access" to "Only myself", save
5. Change back to "Anyone", save
6. Re-authorize when prompted

### Error: "ReferenceError: GmailApp is not defined"

**Cause:** The script isn't authorized to use Gmail.

**Solution:** 
1. In the GAS editor, click the ▶️ "Run" button
2. Select the `testEmail` function
3. Click "Run" - this triggers authorization
4. Follow the authorization prompts

### Emails not arriving

**Check:**
1. **Spam folder** - Gmail might filter your own test emails
2. **Sent folder** - Emails sent via GmailApp appear in your sent folder
3. **GAS logs** - In GAS editor, click "Executions" (left sidebar) to see logs
4. **Vercel logs** - Check if the POST request is being made

### Error: "The script completed but did not return anything"

**Cause:** The `to` email address is invalid or blocked.

**Solution:**
- Use a valid Gmail address for testing
- Check GAS execution logs for detailed error messages

---

## Understanding the Email Format

The agent composes HTML emails with this structure:

```html
<h2 style="color: #dc2626;">Portfolio Alert - PRJ-2024-001</h2>

<div style="background: #fee; padding: 15px; border-radius: 8px;">
  <h3>Critical Findings</h3>
  <ul>
    <li><strong>Unbilled Work:</strong> $12,450 (SOV-04-DUCT)</li>
    <li><strong>Verbal Approval:</strong> Additional ductwork not documented</li>
    <li><strong>Labor Overrun:</strong> 48% over budget on install phase</li>
  </ul>
</div>

<h3>Recommended Actions</h3>
<ol>
  <li>Submit CO-008 immediately for additional scope (+$12,450)</li>
  <li>Document verbal approval in writing</li>
  <li>Review labor allocation for remaining phases</li>
</ol>
```

**Risk colors:**
- `#dc2626` (red) - Critical/High risk
- `#d97706` (amber) - Medium risk  
- `#16a34a` (green) - Healthy/Low risk

---

## Advanced: Email Templates

You can customize email templates by modifying the system prompt in `/vercel/share/v0-project/lib/system-prompt.ts`:

```typescript
// Find the EMAIL REPORTS section and customize:
When asked to email findings, compose a professional HTML email with:
- Clear subject line indicating urgency level
- Your custom sections here...
```

---

## Security Notes

- **"Anyone" access is safe** - The webhook URL is secret and not guessable
- **Execution as "Me"** - Emails come from your account, keeping audit trail
- **Rate limits** - Gmail free tier: 100 emails/day (more than enough)
- **No API keys exposed** - The webhook URL is the only credential

---

## Demo Script (for presentations)

1. **Show the agent** - Type: "How's my portfolio doing?"
2. **Wait for analysis** - Agent chains 4-5 tool calls autonomously
3. **Request email** - Type: "Email me everything we just discussed"
4. **Pull up phone** - Show the email arriving in real-time (mic drop moment)

Total demo time: 60 seconds.

---

## Support

If you encounter issues:
1. Check the [GAS execution logs](https://script.google.com) - click "Executions"
2. Check Vercel function logs
3. Test the webhook URL directly with curl
4. Verify environment variables are set correctly in Vercel

---

**You're all set!** The email system is now fully functional.
