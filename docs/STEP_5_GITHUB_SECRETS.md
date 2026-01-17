# Step 5: Configure GitHub Secrets for SSH Deployment

## What Was Created

✅ **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
- Automatically builds frontend and backend
- Deploys via SSH when you push to `main` branch

✅ **Deployment Script** (`deploy-cpanel-auto.sh`)
- Deploys frontend to `public_html`
- Deploys backend to `~/api`
- Handles file permissions and directory setup

## Next Step: Set Up GitHub Secrets

For GitHub Actions to deploy to your cPanel server, you need to configure SSH secrets.

### Step 5A: Generate SSH Key Pair (if you don't have one)

**On your local machine**, run these commands:

```bash
# Generate SSH key pair (if you don't have one for this server)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/cpanel_deploy

# This will create:
# ~/.ssh/cpanel_deploy (private key) - Keep this secret!
# ~/.ssh/cpanel_deploy.pub (public key) - Add to server
```

**Or use existing SSH key** if you already have one set up for your cPanel server.

### Step 5B: Add Public Key to cPanel Server

**Option 1: Via cPanel Terminal (Recommended)**

1. Copy your **public key** content:
   ```bash
   # On your local machine, display the public key:
   cat ~/.ssh/cpanel_deploy.pub
   ```

2. In cPanel Terminal, run:
   ```bash
   # Create .ssh directory if it doesn't exist
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   
   # Append public key to authorized_keys
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   
   # Set correct permissions
   chmod 600 ~/.ssh/authorized_keys
   ```

**Option 2: Via cPanel SSH Access Page**

1. Go to cPanel → **SSH Access** → **Manage SSH Keys**
2. Click **Import Key** or **Generate Key**
3. Add the public key to your account

### Step 5C: Test SSH Connection

**On your local machine**, test SSH connection:

```bash
# Test connection (adjust port if needed)
ssh -i ~/.ssh/cpanel_deploy paaera@secure.cbnex.com

# Or if you need to specify port:
ssh -i ~/.ssh/cpanel_deploy -p 22 paaera@secure.cbnex.com
```

If successful, you should be logged into your cPanel server.

### Step 5D: Add Secrets to GitHub Repository

1. Go to your GitHub repository: `https://github.com/marzan3698/omni`

2. Navigate to: **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret** and add these secrets:

   **Secret 1: `CPANEL_HOST`**
   - Name: `CPANEL_HOST`
   - Value: `secure.cbnex.com` (or your actual SSH hostname)

   **Secret 2: `CPANEL_USER`**
   - Name: `CPANEL_USER`
   - Value: `paaera`

   **Secret 3: `SSH_PRIVATE_KEY`**
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the **entire content** of your private key:
     ```bash
     cat ~/.ssh/cpanel_deploy
     ```
     Copy everything including:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     ...
     -----END OPENSSH PRIVATE KEY-----
     ```

   **Secret 4: `SSH_PORT` (Optional)**
   - Name: `SSH_PORT`
   - Value: `22` (default SSH port, only needed if different)

---

## Summary of Secrets Needed

| Secret Name | Value | Example |
|------------|-------|---------|
| `CPANEL_HOST` | Your SSH hostname | `secure.cbnex.com` |
| `CPANEL_USER` | cPanel username | `paaera` |
| `SSH_PRIVATE_KEY` | Full private key content | (from ~/.ssh/cpanel_deploy) |
| `SSH_PORT` | SSH port (optional) | `22` |

---

## What to Share

After completing Step 5, please confirm:
1. ✅ SSH key pair generated (or existing key ready)
2. ✅ Public key added to cPanel server
3. ✅ SSH connection tested successfully
4. ✅ All 3-4 GitHub secrets added to repository

Once confirmed, we'll proceed to **Step 6: Create Git Repository on Server** (if needed) or **Step 7: Test the Deployment**.
