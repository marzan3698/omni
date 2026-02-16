# লেটেস্ট কোড Pull করা এবং GitHub–cPanel অটো আপডেট (বাংলা)

## কীভাবে লেটেস্ট কোড Pull করবেন

আপনার কোড যদি ইতিমধ্যে cPanel এ **Git দিয়ে ক্লোন** করা থাকে (যেমন `public_html/omni`), তাহলে নতুন কোড আনার দুটি সহজ উপায় আছে।

---

### পদ্ধতি ১: SSH দিয়ে Pull (সবচেয়ে সহজ)

1. **cPanel থেকে Terminal খুলুন**  
   cPanel → **Tools** → **Terminal** (অথবা **SSH Access** দিয়ে বাইরে থেকে SSH করুন)।

2. **রিপো জ folder এ যান এবং pull করুন:**
   ```bash
   cd /home/imocis/public_html/omni
   git pull origin main
   ```
   যদি ব্রাঞ্চের নাম `master` হয় তাহলে:
   ```bash
   git pull origin master
   ```

3. **Server ফোল্ডারে install ও build চালান (Node.js অ্যাপ আপডেটের জন্য):**
   ```bash
   cd /home/imocis/public_html/omni/server
   npm install
   npm run build
   ```

4. **Node.js অ্যাপ রিস্টার্ট করুন**  
   cPanel → **Node.js Selector** → আপনার অ্যাপ (imoics.com) → **Restart** বাটন ক্লিক করুন।

এভাবে আপনি যেকোনো সময় হাতে করে লেটেস্ট কোড pull এবং build করে নিতে পারবেন।

---

### পদ্ধতি ২: File Manager / FTP দিয়ে আপলোড

যদি SSH না থাকে বা Git ব্যবহার না করেন:

1. লোকালে প্রজেক্টে `git pull` করে লেটেস্ট কোড নিন।
2. **File Manager** (অথবা FileZilla ইত্যাদি FTP) দিয়ে সংশ্লিষ্ট ফোল্ডারগুলো cPanel এ আপলোড করুন।  
   উদাহরণ: `server` ফোল্ডারটা `public_html/omni/server` এ রিপ্লেস করুন।
3. cPanel **Node.js Selector** থেকে **Run NPM Install** চালান (server ফোল্ডার যেখানে সেট আছে সেখানে)。
4. **Run JS script** দিয়ে **build** চালান।
5. অ্যাপ **Restart** করুন।

এ পদ্ধতিতে প্রতিবার পুরনো ফাইল রিপ্লেস করতে হয়, তাই SSH + Git পদ্ধতি সুবিধাজনক।

---

## GitHub–cPanel কানেক্ট করে অটো আপডেট করা

হ্যাঁ, **GitHub কে cPanel এর সাথে কানেক্ট** করে রাখা যায় এবং **GitHub Actions** দিয়ে প্রতিবার পুশ করলেই অটোমেটিকভাবে:

- লেটেস্ট কোড সার্ভারে আপডেট করা,
- `npm install`, `prisma generate`, build চালানো,
- (প্রয়োজন হলে) ফ্রন্টেন্ড বিল্ড ও ফাইল কপি করা,

ইত্যাদি করা যায়।

### কী কী লাগে

1. **cPanel এ SSH অ্যাক্সেস** চালু থাকতে হবে।
2. **GitHub repository** (যেমন `marzan3698/omni`)।
3. **GitHub Secrets** এ cPanel এর SSH তথ্য (host, user, private key, port) সেট করা।

একবার সেটআপ হলে: আপনি শুধু `main` (বা `master`) ব্রাঞ্চে **push** করলেই GitHub Actions নিজে থেকে সার্ভারে ঢুকে কোড আপডেট ও বিল্ড করে দিতে পারবে।

---

## GitHub Actions দিয়ে কী কী অটোমেটিক করা যায়

| কাজ | ব্যাখ্যা |
|-----|----------|
| **কোড আপডেট** | প্রতিবার push এ সার্ভারে `git pull` অথবা নতুন ফাইল কপি |
| **npm install** | server ফোল্ডারে `npm install` চালানো |
| **Prisma generate** | `npx prisma generate` (ডাটাবেস টাইপ জেনারেট) |
| **Backend build** | `npm run build` (TypeScript থেকে `dist/` বানানো) |
| **Frontend build** | client ফোল্ডারে `npm run build` করে স্ট্যাটিক ফাইল তৈরি |
| **ফাইল কপি** | বিল্ড করা ফাইলগুলো সঠিক জায়গায় (যেমন `public_html`, `public_html/omni/server`) কপি করা |
| **মাইগ্রেশন** | চাইলে `npx prisma migrate deploy` ও চালানো যায় (সাবধানে) |

**রিস্টার্ট:** অনেক হোস্টিংয়ে Node.js অ্যাপ রিস্টার্ট শুধু cPanel UI থেকে করা যায়। তাই Actions এ একটা ধাপে লিখে রাখা যায়: “Deployment শেষ। cPanel থেকে Node.js অ্যাপ Restart করুন” — অথবা যদি হোস্ট **cPanel API** বা রিস্টার্ট স্ক্রিপ্ট দেয় তাহলে সেটাও Actions থেকে চালানো যায়।

---

## সেটআপ সংক্ষেপে (অটো ডিপ্লয়মেন্ট)

1. **SSH কী বানান** (কম্পিউটারে একবার):  
   `ssh-keygen -t ed25519 -C "github-cpanel" -f ~/.ssh/cpanel_deploy`

2. **Public key cPanel এ দিন:**  
   cPanel → **SSH Access** → **Manage SSH Keys** → Import Key → `cpanel_deploy.pub` এর কনটেন্ট পেস্ট করুন। তারপর **Authorization** করুন (Use Key)।

3. **GitHub এ Secrets যোগ করুন:**  
   Repo → **Settings** → **Secrets and variables** → **Actions** → New repository secret:
   - `CPANEL_HOST` = আপনার cPanel হোস্ট (যেমন `asia.cbnex.com` বা `imoics.com`)
   - `CPANEL_USER` = cPanel ইউজারনেম (যেমন `imocis`)
   - `SSH_PRIVATE_KEY` = `cpanel_deploy` প্রাইভেট কী এর পুরো টেক্সট (BEGIN/END সহ)
   - `SSH_PORT` = পোর্ট (সাধারণত `2222`)

4. **Workflow ফাইল:**  
   এই রিপোতে ইতিমধ্যে `.github/workflows/deploy.yml` আছে (পূরা বিল্ড + SCP ডিপ্লয়)।  
   imoics.com এর জন্য **শুধু git pull + server build** চালানোর একটা আলাদা workflow আছে:  
   `.github/workflows/deploy-imoics-pull.yml`  
   এটা main ব্রাঞ্চে পুশ হলেই `public_html/omni` তে গিয়ে pull ও server বিল্ড চালাবে।

5. **প্রথম ডিপ্লয়ের পর:**  
   cPanel **Node.js Selector** থেকে অ্যাপ একবার **Restart** করে নিন; পরবর্তী প্রতিটি ডিপ্লয়ের পরও রিস্টার্ট করলে লেটেস্ট কোড ঠিকভাবে লোড হয়।

---

## সংক্ষেপে উত্তর

| প্রশ্ন | উত্তর |
|--------|--------|
| **লেটেস্ট কোড কীভাবে pull করব?** | SSH এ `cd /home/imocis/public_html/omni` করে `git pull origin main` চালান। তারপর `cd server` → `npm install` → `npm run build` এবং cPanel থেকে Node অ্যাপ Restart করুন। |
| **GitHub–cPanel কানেক্ট করে অটো আপডেট করা যাবে?** | হ্যাঁ। GitHub Actions + SSH দিয়ে প্রতিবার push এ অটোমেটিক কোড আপডেট ও বিল্ড করা যায়। |
| **অন্যান্য কাজ GitHub Actions দিয়ে?** | হ্যাঁ। install, prisma generate, build, ফাইল কপি, (এবং প্রযোজ্য হলে migrate) — সব Actions দিয়ে অটোমেটিক করা যায়। |

বিস্তারিত SSH কী ও Secrets সেটআপের জন্য `docs/GITHUB_CPANEL_AUTO_DEPLOY_BANGLA.md` দেখুন।
