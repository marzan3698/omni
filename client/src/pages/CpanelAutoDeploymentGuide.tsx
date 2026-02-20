import { useState } from 'react';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, Copy, Check, Terminal, Database, Server, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── All command/code constants ──────────────────────────────────────────────

const CMD_GIT_CLONE = `cd ~ && git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git omni-repo`;

const CMD_ACTIVATE_NODEVENV = `source ~/nodevenv/omni-repo/server/20/bin/activate`;

const CMD_NPM_INSTALL = `cd ~/omni-repo/server
npm install --ignore-scripts`;

const SCHEMA_BINARY_TARGETS = `generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.0.x", "debian-openssl-1.1.x"]
}`;

const CMD_PRISMA_SETUP = `source ~/nodevenv/omni-repo/server/20/bin/activate
cd ~/omni-repo/server
npx prisma db push
npx prisma generate`;

const CMD_BUILD_DIST = `source ~/nodevenv/omni-repo/server/20/bin/activate
cd ~/omni-repo/server
npm install --ignore-scripts --include=dev
npx --package=typescript tsc --noEmitOnError false
npx prisma generate`;

const CMD_CREATE_SUPERADMIN = `source ~/nodevenv/omni-repo/server/20/bin/activate
cd ~/omni-repo/server

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // ১. Company তৈরি
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'IMOICS', email: 'info@imoics.com', isActive: true }
  });

  // ২. Superadmin Role তৈরি
  const role = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: { name: 'superadmin', permissions: { all: true } }
  });

  // ৩. Superadmin User তৈরি
  const hash = await bcrypt.hash('Admin@1234', 12);
  const user = await prisma.user.upsert({
    where: { email_companyId: { email: 'admin@imoics.com', companyId: company.id } },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@imoics.com',
      passwordHash: hash,
      roleId: role.id,
      companyId: company.id,
    }
  });

  console.log('✅ Superadmin created:', user.email);
  await prisma.\$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
"`;

const CMD_RESTART_PASSENGER = `mkdir -p ~/omni-repo/server/tmp && touch ~/omni-repo/server/tmp/restart.txt`;

const CMD_TEST_LOGIN = `curl -s -X POST https://imoics.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@imoics.com","password":"Admin@1234"}'`;

const CMD_TEST_HEALTH = `curl -s https://imoics.com/api/health`;

const SQL_DROP_ALL_TABLES = `-- ⚠️ এটি সব table DELETE করবে! আগে Enable foreign key checks uncheck করুন
SET FOREIGN_KEY_CHECKS = 0;

SELECT @schema := DATABASE();

SET @tables = (
  SELECT GROUP_CONCAT(table_name SEPARATOR ', ')
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
);

SET @query = IF(
  @tables IS NOT NULL,
  CONCAT('DROP TABLE IF EXISTS ', @tables),
  'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;`;

const CMD_KILL_OLD_PROCESS = `# পুরনো process খুঁজুন
ps aux | grep "node dist" | grep -v grep

# PID দিয়ে kill করুন (PID নম্বর replace করুন)
kill <PID_NUMBER>

# Confirm করুন
ps aux | grep "node dist" | grep -v grep`;

const CMD_DEBUG_ERROR = `source ~/nodevenv/omni-repo/server/20/bin/activate
cd ~/omni-repo/server

# Server সরাসরি চালু করে error দেখুন
timeout 10 node server.cjs 2>&1`;

const CMD_VERBOSE_ERROR = `# NODE_ENV=development করে actual error দেখুন
curl -s -X POST https://imoics.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@imoics.com","password":"Admin@1234"}'`;

const SERVER_CJS_CONTENT = `// server.cjs - cPanel Passenger startup file (CommonJS)
import('./dist/server.js')
  .then(() => {
    console.log('✅ ES Module loaded successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to load ES Module:', error);
    process.exit(1);
  });`;

const NODE_SELECTOR_ENV_VARS = `NODE_ENV=production
DATABASE_URL=mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/YOUR_DB_NAME
JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
JWT_EXPIRES_IN=604800
CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api

# ⚠️ PORT variable যোগ করবেন না! Passenger নিজেই manage করে।`;

const GITHUB_ACTIONS_YML = `name: Deploy to cPanel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Build Frontend
        working-directory: ./client
        env:
          VITE_API_URL: https://yourdomain.com/api
        run: |
          npm ci
          npm run build

      - name: Build Backend
        working-directory: ./server
        env:
          PUPPETEER_SKIP_DOWNLOAD: true
        run: |
          npm ci --ignore-scripts
          npx prisma generate
          npm run build

      - name: Deploy Frontend to cPanel
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.CPANEL_HOST }}
          username: \${{ secrets.CPANEL_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: \${{ secrets.SSH_PORT }}
          source: "client/dist/*"
          target: "~/public_html/"
          strip_components: 2

      - name: Deploy Backend dist/ to cPanel
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.CPANEL_HOST }}
          username: \${{ secrets.CPANEL_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: \${{ secrets.SSH_PORT }}
          source: "server/dist/*"
          target: "~/omni-repo/server/dist/"
          strip_components: 2

      - name: Post-deploy Setup
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.CPANEL_HOST }}
          username: \${{ secrets.CPANEL_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: \${{ secrets.SSH_PORT }}
          script: |
            cd ~/omni-repo && git pull origin main
            source ~/nodevenv/omni-repo/server/20/bin/activate
            cd ~/omni-repo/server
            npm install --ignore-scripts
            npx prisma generate
            mkdir -p tmp && touch tmp/restart.txt
            echo "✅ Deployment complete"`;

const HTACCESS_CONTENT = `# React Router support
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]`;

const WHATSAPP_FIX = `// server/src/services/whatsapp.service.ts - শুরুতে এভাবে করুন

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Lazy-load - cPanel এ না থাকলে server crash করবে না
let whatsappAvailable = false;
let WhatsAppClient: any = null;
let LocalAuth: any = null;
try {
  const ww = require('whatsapp-web.js');
  WhatsAppClient = ww.Client;
  LocalAuth = ww.LocalAuth;
  whatsappAvailable = true;
} catch (e) {
  console.warn('⚠️ whatsapp-web.js not available. WhatsApp features disabled.');
}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CpanelAutoDeploymentGuide() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      //
    }
  };

  const s = {
    card: 'group rounded-xl border border-amber-500/20 bg-slate-800/40 hover:bg-amber-500/5 transition-colors',
    summary: 'cursor-pointer list-none flex items-center justify-between gap-3 py-4 px-5 font-medium text-amber-100 select-none',
    content: 'px-5 pb-5 pt-1 text-amber-200/80 text-sm space-y-4',
    code: 'rounded-lg border border-amber-500/20 bg-slate-900/80 overflow-hidden',
    pre: 'p-4 pr-12 text-xs sm:text-sm overflow-x-auto font-mono text-amber-100 whitespace-pre',
    inline: 'px-1.5 py-0.5 bg-amber-500/20 rounded text-amber-200 border border-amber-500/30 font-mono text-xs',
    strong: 'text-amber-300 font-semibold',
    badge: (color: string) => `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`,
    warn: 'p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs',
    tip: 'p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs',
    note: 'p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs',
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <Button
      type="button" variant="outline" size="sm"
      className="absolute top-2 right-2 h-7 w-7 p-0 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
      onClick={() => copyToClipboard(text, id)}
      title="কপি করুন"
    >
      {copiedId === id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className={`relative ${s.code}`}>
      <pre className={s.pre}>{code}</pre>
      <CopyBtn text={code} id={id} />
    </div>
  );

  const Section = ({ icon, title, badge, children }: {
    icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode;
  }) => (
    <details className={s.card}>
      <summary className={s.summary}>
        <span className="flex items-center gap-2.5">
          <span className="text-amber-400">{icon}</span>
          <span>{title}</span>
          {badge && <span className={s.badge('border-amber-500/40 text-amber-400 bg-amber-500/10')}>{badge}</span>}
        </span>
        <ChevronDown className="h-4 w-4 text-amber-400 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className={s.content}>{children}</div>
    </details>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div className="flex items-center gap-3 mb-2">
          <Server className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-amber-100">New cPanel Setup গাইড</h1>
        </div>
        <p className="text-amber-200/70 text-sm">
          একটি নতুন cPanel সার্ভারে এই প্রজেক্ট ডিপ্লয় করার সম্পূর্ণ ধাপ-by-ধাপ গাইড।
          প্রতিটি ধাপের command কপি করতে পারবেন।
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={s.badge('border-blue-500/40 text-blue-300 bg-blue-500/10')}>Node.js 20</span>
          <span className={s.badge('border-purple-500/40 text-purple-300 bg-purple-500/10')}>Prisma + MySQL</span>
          <span className={s.badge('border-emerald-500/40 text-emerald-300 bg-emerald-500/10')}>GitHub Actions CI/CD</span>
          <span className={s.badge('border-amber-500/40 text-amber-300 bg-amber-500/10')}>Passenger / cPanel</span>
        </div>
      </div>

      {/* Quick Overview */}
      <GamePanel>
        <div className="p-5">
          <h2 className="text-lg font-semibold text-amber-100 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Deployment Checklist (সংক্ষিপ্ত)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              '১. GitHub Repo তৈরি ও সব code push',
              '২. GitHub Actions workflow যোগ করা',
              '৩. GitHub Secrets সেট করা',
              '৪. cPanel MySQL Database তৈরি',
              '৫. cPanel এ Repo Clone করা',
              '৬. schema.prisma binaryTargets ঠিক করা',
              '৭. Node.js Selector এ App তৈরি',
              '৮. Environment Variables সেট করা',
              '৯. npm install ও TypeScript build',
              '১০. Prisma db push ও generate',
              '১১. Superadmin account তৈরি',
              '১২. Passenger restart ও login test',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-amber-200/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </GamePanel>

      {/* FAQ Sections */}
      <GamePanel>
        <div className="p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100 mb-4">
            <HelpCircle className="h-5 w-5 text-amber-400" />
            ধাপে ধাপে সম্পূর্ণ গাইড
          </h2>
          <div className="space-y-2">

            {/* STEP 1 */}
            <Section icon={<Code2 className="h-4 w-4" />} title="Step 1: GitHub Secrets সেট করুন" badge="একবারই করতে হবে">
              <p>GitHub Repository → <strong className={s.strong}>Settings → Secrets and Variables → Actions → New Repository Secret</strong></p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs rounded-lg overflow-hidden border border-amber-500/20">
                  <thead>
                    <tr className="bg-amber-500/20">
                      <th className="px-3 py-2 text-left text-amber-200">Secret নাম</th>
                      <th className="px-3 py-2 text-left text-amber-200">মান</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {[
                      ['CPANEL_HOST', 'আপনার সার্ভার IP বা hostname (যেমন: 15.235.182.215)'],
                      ['CPANEL_USER', 'cPanel username (যেমন: imocis)'],
                      ['SSH_PRIVATE_KEY', 'SSH private key (cPanel → SSH Access থেকে generate করুন)'],
                      ['SSH_PORT', 'SSH port (সাধারণত 22, cPanel-এ 21098 বা অন্য হতে পারে)'],
                    ].map(([name, val]) => (
                      <tr key={name} className="hover:bg-amber-500/5">
                        <td className="px-3 py-2"><code className={s.inline}>{name}</code></td>
                        <td className="px-3 py-2 text-amber-200/70">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={s.tip}>
                <strong>💡 SSH Key পেতে:</strong> cPanel → Security → SSH Access → Manage SSH Keys → Generate a New Key → Public key টা GitHub-এ, Private key টা Secret-এ দিন।
              </div>
            </Section>

            {/* STEP 2 */}
            <Section icon={<Code2 className="h-4 w-4" />} title="Step 2: GitHub Actions Workflow (.github/workflows/deploy.yml)">
              <p>প্রজেক্ট root-এ <code className={s.inline}>.github/workflows/deploy.yml</code> ফাইল তৈরি করুন:</p>
              <CodeBlock code={GITHUB_ACTIONS_YML} id="gha-yml" />
              <div className={s.warn}>
                <strong>⚠️ মনে রাখুন:</strong> <code className={s.inline}>VITE_API_URL</code>, <code className={s.inline}>target</code> পাথ এবং domain আপনার সার্ভার অনুযায়ী পরিবর্তন করুন।
              </div>
              <p className="mt-2">Frontend-এ <code className={s.inline}>public_html/</code> এ একটি <code className={s.inline}>.htaccess</code> ফাইল রাখুন React Router-এর জন্য:</p>
              <CodeBlock code={HTACCESS_CONTENT} id="htaccess" />
            </Section>

            {/* STEP 3 */}
            <Section icon={<Database className="h-4 w-4" />} title="Step 3: cPanel এ MySQL Database তৈরি">
              <p>cPanel → <strong className={s.strong}>MySQL Databases</strong> এ যান:</p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li><strong className={s.strong}>Database তৈরি:</strong> <em>Create New Database</em> → suffix দিন (যেমন <code className={s.inline}>database</code> → পুরো নাম হবে <code className={s.inline}>imocis_database</code>)</li>
                <li><strong className={s.strong}>User তৈরি:</strong> <em>Add New User</em> → username ও strong password দিন। <strong>Password সেভ করুন!</strong></li>
                <li><strong className={s.strong}>User → Database Assign:</strong> <em>Add User To Database</em> → database ও user choose করুন → <strong>ALL PRIVILEGES</strong> দিন</li>
              </ol>
              <div className={s.note}>
                <strong>ℹ️ Note:</strong> cPanel-এ database ও user নামে আপনার cPanel username prefix হিসেবে যুক্ত হয়। সম্পূর্ণ নামটি DATABASE_URL-এ ব্যবহার করুন।
              </div>
            </Section>

            {/* STEP 4 */}
            <Section icon={<Terminal className="h-4 w-4" />} title="Step 4: cPanel Terminal এ Repo Clone করুন">
              <p>cPanel → Advanced → <strong className={s.strong}>Terminal</strong> খুলুন এবং চালান:</p>
              <CodeBlock code={CMD_GIT_CLONE} id="git-clone" />
              <div className={s.tip}>
                <strong>💡 Private repo হলে:</strong> HTTPS-এর পরিবর্তে Personal Access Token ব্যবহার করুন: <code className={s.inline}>https://TOKEN@github.com/user/repo.git</code>
              </div>
            </Section>

            {/* STEP 5 */}
            <Section icon={<Server className="h-4 w-4" />} title="Step 5: Node.js Selector এ Application তৈরি">
              <p>cPanel → Softaculous Apps / Tools → <strong className={s.strong}>Node.js</strong> → <strong className={s.strong}>CREATE APPLICATION</strong></p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs rounded-lg overflow-hidden border border-amber-500/20">
                  <thead>
                    <tr className="bg-amber-500/20">
                      <th className="px-3 py-2 text-left text-amber-200">Field</th>
                      <th className="px-3 py-2 text-left text-amber-200">মান</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {[
                      ['Node.js version', '20.x (সর্বোচ্চ available version)'],
                      ['Application mode', 'Production'],
                      ['Application root', 'omni-repo/server (repo clone করা folder)'],
                      ['Application URL', 'yourdomain.com/api'],
                      ['Application startup file', 'server.cjs'],
                    ].map(([field, val]) => (
                      <tr key={field} className="hover:bg-amber-500/5">
                        <td className="px-3 py-2 font-semibold text-amber-300">{field}</td>
                        <td className="px-3 py-2 text-amber-200/70"><code className={s.inline}>{val}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 font-medium text-amber-200">Environment Variables সেট করুন:</p>
              <CodeBlock code={NODE_SELECTOR_ENV_VARS} id="env-vars" />
              <div className={s.warn}>
                <strong>⚠️ CRITICAL:</strong> <code className={s.inline}>PORT</code> variable <strong>যোগ করবেন না!</strong> PORT set করলে Passenger নিজের port assign করতে পারে না এবং সব API call 500 error দেয়।
              </div>
            </Section>

            {/* STEP 6 */}
            <Section icon={<Code2 className="h-4 w-4" />} title="Step 6: schema.prisma এ binaryTargets ঠিক করুন" badge="Critical Fix">
              <p>
                <code className={s.inline}>server/prisma/schema.prisma</code> ফাইলের{' '}
                <code className={s.inline}>generator client</code> block-এ <strong className={s.strong}>debian-openssl-1.1.x</strong> যোগ করুন।
                cPanel সার্ভার OpenSSL 1.1.x ব্যবহার করে কিন্তু GitHub Actions 1.0.x-এ build করে — এই mismatch থেকে 500 error হয়:
              </p>
              <CodeBlock code={SCHEMA_BINARY_TARGETS} id="schema" />
              <div className={s.warn}>
                <strong>⚠️ এটা না করলে:</strong> সব API call-এ <em>"Prisma Client could not locate the Query Engine"</em> error আসবে এবং login সহ সব feature কাজ করবে না।
              </div>
            </Section>

            {/* STEP 7 */}
            <Section icon={<Code2 className="h-4 w-4" />} title="Step 7: server.cjs ফাইল তৈরি/যাচাই করুন">
              <p>
                <code className={s.inline}>server/server.cjs</code> ফাইলটি Passenger-এর startup file।
                এটি CommonJS (.cjs) হওয়া দরকার কারণ Passenger CommonJS দিয়েই শুরু করে। ফাইলের content:
              </p>
              <CodeBlock code={SERVER_CJS_CONTENT} id="server-cjs" />
              <p className="mt-2">
                এছাড়া <code className={s.inline}>server/package.json</code>-এ <code className={s.inline}>"type": "module"</code> থাকা আবশ্যক যেন dist/ ফাইলগুলো ESM হিসেবে load হয়।
              </p>
            </Section>

            {/* STEP 8 */}
            <Section icon={<Code2 className="h-4 w-4" />} title="Step 8: whatsapp-web.js Lazy Load করুন (cPanel Fix)" badge="cPanel Fix">
              <p>
                cPanel-এ <code className={s.inline}>whatsapp-web.js</code> ইনস্টল হয় না (puppeteer dependency-র কারণে)।
                সরাসরি import করলে server শুরুতেই crash করে। Lazy load pattern ব্যবহার করুন:
              </p>
              <CodeBlock code={WHATSAPP_FIX} id="wa-fix" />
              <div className={s.note}>
                এই পরিবর্তনের পরে re-build করতে হবে (Step 9)।
              </div>
            </Section>

            {/* STEP 9 */}
            <Section icon={<Terminal className="h-4 w-4" />} title="Step 9: npm install ও TypeScript Build করুন">
              <p>Terminal-এ চালান:</p>
              <CodeBlock code={CMD_BUILD_DIST} id="build" />
              <div className={s.note}>
                <strong>ℹ️ Note:</strong> TypeScript error থাকলেও <code className={s.inline}>--noEmitOnError false</code> flag দেওয়ায় dist/ তৈরি হবে।
              </div>
            </Section>

            {/* STEP 10 */}
            <Section icon={<Database className="h-4 w-4" />} title="Step 10: Prisma Database Setup করুন">
              <p>Database schema create এবং Prisma client generate করুন:</p>
              <CodeBlock code={CMD_PRISMA_SETUP} id="prisma-setup" />
              <div className={s.tip}>
                <strong>💡 prisma db push:</strong> Schema থেকে সরাসরি database table তৈরি করে।
                Migration ছাড়াই কাজ করে — production-এ প্রথম setup-এর জন্য আদর্শ।
              </div>
            </Section>

            {/* STEP 11 */}
            <Section icon={<Terminal className="h-4 w-4" />} title="Step 11: Superadmin Account তৈরি করুন">
              <p>Terminal-এ এই script চালিয়ে superadmin user তৈরি করুন (email ও password আপনার পছন্দ অনুযায়ী পরিবর্তন করুন):</p>
              <CodeBlock code={CMD_CREATE_SUPERADMIN} id="superadmin" />
              <div className={s.warn}>
                <strong>⚠️ Schema অনুযায়ী:</strong> User তৈরিতে <code className={s.inline}>passwordHash</code> field ব্যবহার করতে হবে (<code className={s.inline}>password</code> নয়)। Company ও Role আগে তৈরি করতে হবে।
              </div>
            </Section>

            {/* STEP 12 */}
            <Section icon={<Server className="h-4 w-4" />} title="Step 12: Passenger Restart ও Final Test">
              <p><strong className={s.strong}>১. Passenger restart trigger করুন:</strong></p>
              <CodeBlock code={CMD_RESTART_PASSENGER} id="restart" />
              <p className="mt-3"><strong className={s.strong}>২. Node.js Selector থেকে RESTART করুন:</strong></p>
              <p>cPanel → Node.js Selector → আপনার app → <strong>RESTART</strong> button ক্লিক করুন।</p>
              <p className="mt-3"><strong className={s.strong}>৩. Login test করুন:</strong></p>
              <CodeBlock code={CMD_TEST_LOGIN} id="test-login" />
              <p className="mt-2 text-emerald-300 font-medium">✅ সফল response:</p>
              <div className={`${s.code} mt-1`}>
                <pre className={s.pre}>{`{"success":true,"message":"Login successful","data":{"user":{...},"token":"eyJ..."}}`}</pre>
              </div>
            </Section>

          </div>
        </div>
      </GamePanel>

      {/* Troubleshooting */}
      <GamePanel>
        <div className="p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            সাধারণ সমস্যা ও সমাধান (Troubleshooting)
          </h2>
          <div className="space-y-2">

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: "Prisma Client could not locate the Query Engine"'>
              <div className={s.warn}>এই error মানে Prisma binary target cPanel server-এর সাথে match করছে না।</div>
              <p className="mt-2"><strong className={s.strong}>সমাধান:</strong> schema.prisma এ <code className={s.inline}>debian-openssl-1.1.x</code> যোগ করুন (Step 6 দেখুন), তারপর:</p>
              <CodeBlock code={CMD_PRISMA_SETUP} id="fix-prisma" />
              <p>তারপর Node.js Selector → RESTART করুন।</p>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: সব API call 500 error দেয় (PORT conflict)'>
              <div className={s.warn}>Node.js Selector-এ PORT variable set থাকলে Passenger নিজের port assign করতে পারে না।</div>
              <p className="mt-2"><strong className={s.strong}>সমাধান:</strong> Node.js Selector → Environment Variables → <strong>PORT variable DELETE করুন</strong> → Save → Restart।</p>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: "It works! NodeJS X.X.X" দেখাচ্ছে (503)'>
              <div className={s.warn}>Passenger আপনার app শুরু করতে পারছে না, default page দেখাচ্ছে।</div>
              <p className="mt-2"><strong className={s.strong}>Diagnose করুন:</strong></p>
              <CodeBlock code={CMD_DEBUG_ERROR} id="debug" />
              <p className="mt-2">সাধারণ কারণ: dist/ ফাইল নেই, whatsapp-web.js crash, বা PORT conflict।</p>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: "Login failed" (actual error দেখতে)'>
              <p><strong className={s.strong}>১. Node.js Selector-এ <code className={s.inline}>NODE_ENV</code> সাময়িক <code className={s.inline}>development</code> করুন → Restart</strong></p>
              <p><strong className={s.strong}>২. তারপর এই curl request করুন:</strong></p>
              <CodeBlock code={CMD_VERBOSE_ERROR} id="verbose-err" />
              <p>Development mode-এ full error message response-এ আসবে। Error ঠিক করার পরে NODE_ENV আবার <code className={s.inline}>production</code> করুন।</p>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: পুরনো Node.js process port দখল করে রেখেছে'>
              <div className={s.warn}>Terminal এ manually <code className={s.inline}>node dist/server.js</code> চালালে সেটা background-এ চলতে থাকে এবং port 5001 দখল করে।</div>
              <p className="mt-2"><strong className={s.strong}>সমাধান:</strong></p>
              <CodeBlock code={CMD_KILL_OLD_PROCESS} id="kill-proc" />
              <p className="mt-2">তারপর Node.js Selector → RESTART করুন।</p>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title='সমস্যা: whatsapp-web.js crash করছে'>
              <div className={s.warn}>cPanel-এ puppeteer চলে না তাই whatsapp-web.js install হয় না। Hard import করলে server startup-এই crash।</div>
              <p className="mt-2"><strong className={s.strong}>সমাধান:</strong> Step 8 এর lazy load pattern ব্যবহার করুন, তারপর rebuild করুন (Step 9)।</p>
            </Section>

            <Section icon={<Database className="h-4 w-4" />} title="Local Database থেকে Server Database-এ Data Import করুন" badge="Optional">
              <p>আপনার local XAMPP database-এর data server-এ copy করতে নিচের ধাপ অনুসরণ করুন।</p>

              <p className="font-medium text-amber-200">Step A — Local phpMyAdmin থেকে Export:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li><code className={s.inline}>http://localhost/phpmyadmin</code> খুলুন</li>
                <li>বাম দিকে আপনার database select করুন (যেমন <code className={s.inline}>omni_db</code>)</li>
                <li>উপরে <strong className={s.strong}>Export</strong> tab → Format: <strong>SQL</strong> → <strong>Go</strong></li>
                <li><code className={s.inline}>.sql</code> file download হবে</li>
              </ol>

              <p className="font-medium text-amber-200 mt-3">Step B — Server-এ সব পুরনো Table Delete করুন:</p>
              <p>cPanel phpMyAdmin → <strong className={s.strong}>imocis_database</strong> select → SQL tab-এ নিচের query paste করুন:</p>
              <div className={s.warn}>
                <strong>⚠️ গুরুত্বপূর্ণ:</strong> Query run করার আগে নিচের <strong>"Enable foreign key checks"</strong> checkbox <strong>uncheck</strong> করুন, নইলে <code className={s.inline}>#1451 foreign key constraint fails</code> error আসবে।
              </div>
              <CodeBlock code={SQL_DROP_ALL_TABLES} id="sql-drop" />

              <p className="font-medium text-amber-200 mt-3">Step C — Local SQL File Import করুন:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>cPanel phpMyAdmin → <strong className={s.strong}>imocis_database</strong> select করুন</li>
                <li><strong className={s.strong}>Import</strong> tab → <strong>Choose File</strong> → ডাউনলোড করা <code className={s.inline}>.sql</code> file select করুন</li>
                <li>নিচে <strong>"Enable foreign key checks"</strong> <strong>uncheck</strong> রাখুন</li>
                <li><strong>Go</strong> click করুন → Import সম্পন্ন ✅</li>
              </ol>
              <div className={s.note}>
                <strong>ℹ️ Note:</strong> Local SQL file-এ যদি <code className={s.inline}>USE `omni_db`;</code> এই ধরনের line থাকে, সেটা মুছে দিন বা server database নাম দিয়ে replace করুন import করার আগে।
              </div>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title="গুরুত্বপূর্ণ ফিক্স: File Uploads 500 Error এবং Image 404 Failed to Load">
              <div className={s.warn}>
                <strong>⚠️ cPanel Passenger Environment-এ File Uploads এবং Image Serving-এর জন্য করণীয়:</strong>
              </div>
              <ul className="list-disc list-inside space-y-2 mt-3 text-amber-100/90 text-sm">
                <li>
                  <strong className="text-red-300">500 Internal Server Error (Upload):</strong> cPanel-এ আপলোড করা ফাইল সেভ করার পাথ হিসেবে <code className={s.inline}>path.join(__dirname, '../../uploads')</code> ব্যবহার করলে তা কাজ করবে না এবং 500 Error দিবে। এর পরিবর্তে সর্বদা <code className={s.inline}>path.join(process.cwd(), 'uploads')</code> ব্যবহার করতে হবে।
                </li>
                <li>
                  <strong className="text-red-300">MySQL Database Crash (Error 1366):</strong> ইমোজি বা বাংলা নামযুক্ত ফাইল আপলোড করলে Default MySQL Database ক্র্যাশ করে। এর সমাধানে <code className={s.inline}>task.controller.ts</code>-এ <code className={s.inline}>req.file.originalname.replace(/[^\x00-\x7F]/g, '').trim()</code> দিয়ে ফাইলের নাম স্যানিটাইজ (Sanitize) করতে হবে।
                </li>
                <li>
                  <strong className="text-amber-300">Image 404 Failed to Load:</strong> cPanel-এ Backend <code className={s.inline}>/api</code> রুট দিয়ে চলে। তাই Frontend-এর <code className={s.inline}>lib/utils.ts</code> ফাইলে <code className={s.inline}>getStaticFileBaseUrl()</code> ফাংশনে <code className={s.inline}>VITE_API_URL</code> থেকে <code className={s.inline}>/api</code> প্রিফিক্স রিমুভ করা যাবে না। নতুবা Image url <code className={s.inline}>imoics.com/uploads/...</code> হয়ে যাবে যা 404 এরর দিবে, কারণ সঠিক url হলো <code className={s.inline}>imoics.com/api/uploads/...</code>
                </li>
              </ul>
            </Section>

            <Section icon={<AlertTriangle className="h-4 w-4" />} title="পরবর্তীতে আবার নতুন cPanel এ deploy করলে কি করতে হবে?">
              <div className={s.tip}>
                <strong>✅ সংক্ষিপ্ত checklist নতুন cPanel-এর জন্য:</strong>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 mt-2">
                <li>GitHub Secrets আপডেট করুন (নতুন server IP, user, SSH key)</li>
                <li>cPanel-এ MySQL Database + User তৈরি করুন</li>
                <li>Terminal-এ repo clone করুন</li>
                <li>Node.js Selector-এ app তৈরি করুন (PORT ছাড়া env vars সেট করুন)</li>
                <li><code className={s.inline}>schema.prisma</code> এ binaryTargets ঠিক আছে কিনা দেখুন (Step 6)</li>
                <li><code className={s.inline}>npm install → tsc build → prisma generate → db push</code> চালান</li>
                <li>Superadmin account তৈরি করুন</li>
                <li>Passenger restart করুন</li>
                <li>Login test করুন ✅</li>
              </ol>
              <div className="mt-3">
                <p className="font-medium text-amber-200">Test command:</p>
                <CodeBlock code={CMD_TEST_HEALTH} id="health-check" />
              </div>
            </Section>


          </div>
        </div>
      </GamePanel>
    </div>
  );
}
