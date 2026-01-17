# Step 5D: Find Correct SSH Port

## Issue
SSH connection to `secure.cbnex.com:22` is refused. We need to find the correct SSH port.

## Common SSH Ports for cPanel
- Port 22 (standard, but may be blocked)
- Port 2222 (common alternative)
- Port 2096 (some cPanel hosts)
- Custom port set by hosting provider

## How to Find Your SSH Port

### Option 1: Check cPanel SSH Access Page
1. Go to cPanel → **SSH Access**
2. Look for "SSH Settings" or connection information
3. Note the SSH port mentioned

### Option 2: Check via Terminal
In your cPanel Terminal, try:
```bash
# Check SSH service
cat /etc/ssh/sshd_config | grep -i "^Port"
```

### Option 3: Contact Your Hosting Provider
Your hosting provider may have documentation about SSH access and the port to use.

### Option 4: Try Common Ports
On your local machine, try different ports:
```bash
# Try port 2222
ssh -i ~/.ssh/cpanel_deploy -p 2222 paaera@secure.cbnex.com

# Try port 2096
ssh -i ~/.ssh/cpanel_deploy -p 2096 paaera@secure.cbnex.com
```

---

## Alternative: Use cPanel API for Deployment

If SSH direct access doesn't work, we can use:
1. **cPanel API** with API tokens
2. **FTP/SFTP** via GitHub Actions
3. **cPanel Git Deployment** (if Git is configured in cPanel)

Let me know which SSH port works, or if you'd prefer an alternative method!
