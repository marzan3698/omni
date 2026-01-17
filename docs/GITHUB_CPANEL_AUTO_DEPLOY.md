# GitHub থেকে cPanel Auto Deployment গাইড (বাংলা)

## 📋 Overview

এই গাইড আপনাকে GitHub থেকে cPanel-এ automatic deployment setup করতে সাহায্য করবে।

**Simple Approach**: cPanel Git Version Control ব্যবহার করে auto-deployment

---

## Step 1: GitHub Repository Check

### ✅ Task: আপনার প্রজেক্ট GitHub-এ আছে কিনা verify করুন

**আপনাকে যা করতে হবে:**

1. **Terminal/Command Prompt** খুলুন
2. এই command run করুন:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/omni
   git remote -v
   ```

**Expected Output:**
- যদি GitHub connected থাকে, আপনি দেখবেন:
  ```
  origin  https://github.com/yourusername/your-repo.git (fetch)
  origin  https://github.com/yourusername/your-repo.git (push)
  ```

- যদি GitHub connected না থাকে, আপনি দেখবেন:
  ```
  (no output বা error)
  ```

---

### 📸 আপনার Output পাঠান

আমাকে জানান:
1. `git remote -v` command-এর output কি?
2. GitHub repository URL আছে কিনা?

**যদি GitHub repository নেই:**
- আমি পরবর্তী step-এ GitHub-এ repository তৈরি করতে guide করব

**যদি GitHub repository আছে:**
- আমি পরবর্তী step-এ cPanel Git setup করতে guide করব

---

**⏳ এই step complete করার পর screenshot বা output পাঠান, তারপর পরবর্তী step-এ যাব।**
