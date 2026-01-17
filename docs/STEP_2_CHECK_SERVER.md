# Step 2: Check Server Directory Structure

## Commands to Run in cPanel Terminal

Run these commands one by one in your cPanel Terminal (the black terminal window you just opened):

### 1. Check your current location:
```bash
pwd
```

### 2. List files in your home directory:
```bash
ls -la
```

### 3. Check if public_html exists:
```bash
ls -la public_html
```

### 4. Check the structure of public_html:
```bash
ls -la public_html/
```

### 5. Check available disk space:
```bash
df -h ~
```

### 6. Check Node.js version (if available):
```bash
node --version
```

### 7. Check npm version:
```bash
npm --version
```

---

## What to Share

After running all these commands, please provide:
1. The output of `pwd` (your home directory path)
2. The output of `ls -la public_html` (to see what's currently in public_html)
3. Whether Node.js and npm are installed (version numbers)

This will help me understand your server structure before setting up the automatic deployment.
