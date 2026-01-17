# Step 6: Add GitHub Secrets for Automatic Deployment

## ✅ What's Done

- ✅ SSH key pair generated (`~/.ssh/cpanel_deploy`)
- ✅ Public key added to cPanel server (`~/.ssh/authorized_keys`)
- ✅ SSH connection tested and working (port 2222)
- ✅ GitHub Actions workflow configured (`.github/workflows/deploy.yml`)

## Step 6: Add Secrets to GitHub Repository

Now you need to add the secrets to your GitHub repository so GitHub Actions can deploy automatically.

### Steps to Add GitHub Secrets

1. **Go to your GitHub repository:**
   - Open: `https://github.com/marzan3698/omni`

2. **Navigate to Settings:**
   - Click on **Settings** tab (top menu)

3. **Go to Secrets and variables:**
   - In the left sidebar, click **Secrets and variables** → **Actions**

4. **Add the following secrets:**

   Click **New repository secret** for each one:

   ---

   **Secret 1: `CPANEL_HOST`**
   - **Name:** `CPANEL_HOST`
   - **Value:** `secure.cbnex.com`
   - Click **Add secret**

   ---

   **Secret 2: `CPANEL_USER`**
   - **Name:** `CPANEL_USER`
   - **Value:** `paaera`
   - Click **Add secret**

   ---

   **Secret 3: `SSH_PRIVATE_KEY`**
   - **Name:** `SSH_PRIVATE_KEY`
   - **Value:** Copy the **entire private key** below (including BEGIN and END lines):
   
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   QyNTUxOQAAACChnoZwsHfFjXl6w3SJnjuYRRMG7RCoDSs68BnTfgTEqAAAAJhxznJGcc5y
   RgAAAAtzc2gtZWQyNTUxOQAAACChnoZwsHfFjXl6w3SJnjuYRRMG7RCoDSs68BnTfgTEqA
   AAAECd9I4AyvD+WoscCmFNnkC0P7+UMbBTQyHgjeVBURypiqGehnCwd8WNeXrDdImeO5hF
   EwbtEKgNKzrwGdN+BMSoAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
   -----END OPENSSH PRIVATE KEY-----
   ```
   
   - Click **Add secret**

   ---

   **Secret 4: `SSH_PORT` (Optional but recommended)**
   - **Name:** `SSH_PORT`
   - **Value:** `2222`
   - Click **Add secret**

   ---

## Verification Checklist

After adding all secrets, you should see 4 secrets listed:

- ✅ `CPANEL_HOST`
- ✅ `CPANEL_USER`
- ✅ `SSH_PRIVATE_KEY`
- ✅ `SSH_PORT` (optional, default is 2222 now)

## Next Steps

Once all secrets are added:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add automatic deployment configuration"
   git push origin main
   ```

2. **Trigger deployment:**
   - Either push a new commit, OR
   - Go to GitHub Actions tab → Click on "Deploy Omni CRM to cPanel" → Click "Run workflow"

3. **Monitor deployment:**
   - Go to **Actions** tab in GitHub
   - Watch the deployment workflow run
   - Check logs for any errors

---

## What Happens During Deployment

When you push code to the `main` branch:

1. ✅ GitHub Actions triggers automatically
2. ✅ Connects to your cPanel server via SSH (port 2222)
3. ✅ Pulls latest code from GitHub
4. ✅ Builds frontend (React/Vite)
5. ✅ Builds backend (Node.js/TypeScript)
6. ✅ Deploys frontend to `~/public_html`
7. ✅ Deploys backend to `~/api`
8. ✅ Sets proper file permissions

**Your frontend will be live at:** `https://paaera.com`

---

## Troubleshooting

If deployment fails:

1. Check GitHub Actions logs for errors
2. Verify all secrets are correct
3. Ensure SSH key is in `~/.ssh/authorized_keys` on server
4. Check that Node.js is available on server (for building)

---

**After adding all secrets, let me know and we'll proceed to test the deployment!** 🚀
