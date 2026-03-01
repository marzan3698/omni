import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy, Check, Server, Terminal, CheckCircle2, Package } from 'lucide-react';

// ─── Copyable content constants ────────────────────────────────────────────────

const CMD_SSH_LOGIN = `ssh root@YOUR_SERVER_IP`;

const CMD_SSH_FIRST_TIME = `# প্রথমবার connect করলে এই মেসেজ আসবে:
The authenticity of host '...' can't be established.
ED25519 key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no/[fingerprint])?

# টাইপ করুন: yes
yes`;

const CMD_PASSWORD_PROMPT = `# তারপর পাসওয়ার্ড চাইবে:
root@YOUR_SERVER_IP's password:

# আপনার root পাসওয়ার্ড টাইপ করুন (টাইপ করলে স্ক্রিনে দেখাবে না – এটা স্বাভাবিক)
# Enter চাপুন`;

const CMD_SUCCESS_PROMPT = `# সফল লগইন হলে আপনার টার্মিনাল এমন দেখাবে:
Last login: Sun Mar  1 10:56:30 2026 from 103.153.231.59
[root@alma-8gb-nbg1-2 ~]#

# [root@hostname ~]# মানে আপনি সার্ভারে root হিসেবে লগইন হয়েছেন`;

const CMD_SSH_KEY_GEN = `# SSH key তৈরি করুন (একবার করলেই হবে)
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/omni_deploy -N ""

# Private key দেখুন (এটাই VPS_SSH_PRIVATE_KEY তে দেবেন)
cat ~/.ssh/omni_deploy`;

const CMD_SSH_COPY_ID = `# Public key সার্ভারে যোগ করুন
ssh-copy-id -i ~/.ssh/omni_deploy.pub root@YOUR_SERVER_IP`;

const CMD_INSTALL_GIT = `# Git ইন্সটল (AlmaLinux / RHEL / CentOS)
dnf install git -y

# চেক করুন
git --version`;

const CMD_INSTALL_NODE = `# Node.js 20 ইন্সটল (AlmaLinux / RHEL)
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install nodejs -y

# অথবা dnf module দিয়ে (AlmaLinux 9)
# dnf module install nodejs:20 -y

# চেক করুন
node -v
npm -v`;

const CMD_INSTALL_MYSQL = `# MariaDB/MySQL ইন্সটল (AlmaLinux এ সাধারণত MariaDB)
dnf install mariadb-server -y
systemctl start mariadb
systemctl enable mariadb
mysql_secure_installation

# Database তৈরি করুন (নিচের আলাদা ধাপে)`;

const CMD_CLONE_REPO = `# Repo ক্লোন করুন (YOUR_USERNAME ও YOUR_REPO নিজের repo দিয়ে replace করুন)
git clone https://github.com/YOUR_USERNAME/omni.git ~/omni-repo

# উদাহরণ:
# git clone https://github.com/marzan3698/omni.git ~/omni-repo`;

const CMD_CREATE_DB = `# Database তৈরি করুন (mysql_secure_installation এর পর)
mysql -u root -p -e "CREATE DATABASE omni_db;"
# পাসওয়ার্ড চাইলে আপনার MariaDB root পাসওয়ার্ড দিন`;

const CMD_ENV_EXAMPLE = `# .env ফাইল – পুরো ব্লক একসাথে কপি করে টার্মিনালে পেস্ট করুন
# ">" দেখলে বাকি লাইনগুলো + ENVEOF পেস্ট করুন

cat > ~/omni-repo/server/.env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=mysql://root:YOUR_DB_PASSWORD@localhost:3306/omni_db?connection_limit=3
JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
JWT_EXPIRES_IN=604800
CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
PORT=5001
ENVEOF

# YOUR_DB_PASSWORD: পাসওয়ার্ডে @ থাকলে %40 লিখুন (যেমন: pass@word → pass%40word)
# yourdomain.com: নিজের ডোমেইন (যেমন: imoics.com)`;

const CMD_INSTALL_PM2 = `# PM2 গ্লোবাল ইন্সটল (process manager)
npm install -g pm2`;

const CMD_FIRST_BUILD = `# প্রথমবার build ও migration
cd ~/omni-repo/server
npm install --ignore-scripts
npx prisma generate
npm run build

# dist ফোল্ডার আছে কিনা চেক করুন (TypeScript warning থাকলেও dist তৈরি হতে পারে)
ls -la ~/omni-repo/server/dist/

# migration চালান
node scripts/migrate-simple.cjs`;

const CMD_PM2_START = `# PM2 দিয়ে server চালু করুন
cd ~/omni-repo/server
pm2 start dist/server.js --name omni

# Reboot এ auto-start এর জন্য
pm2 save
pm2 startup`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OmniServerSetupGuide() {
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
    pre: 'p-4 pr-12 text-xs sm:text-sm overflow-x-auto font-mono text-amber-100 whitespace-pre-wrap',
    inline: 'px-1.5 py-0.5 bg-amber-500/20 rounded text-amber-200 border border-amber-500/30 font-mono text-xs',
    strong: 'text-amber-300 font-semibold',
    badge: (color: string) => `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`,
    tip: 'p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs',
    note: 'p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs',
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
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

  const Section = ({
    icon,
    title,
    badge,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    badge?: string;
    children: React.ReactNode;
  }) => (
    <details className={s.card} open>
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
          <h1 className="text-2xl font-bold text-amber-100">Omni Setup on Server</h1>
        </div>
        <p className="text-amber-200/70 text-sm">
          VPS কিংবা ডেডিকেটেড সার্ভারে Omni CRM সেটআপ করার ধাপে ধাপে বাংলা গাইড। প্রতিটি ধাপের কমান্ড কপি করে টার্মিনালে চালাতে পারবেন।
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={s.badge('border-blue-500/40 text-blue-300 bg-blue-500/10')}>SSH</span>
          <span className={s.badge('border-purple-500/40 text-purple-300 bg-purple-500/10')}>VPS</span>
          <span className={s.badge('border-emerald-500/40 text-emerald-300 bg-emerald-500/10')}>ধাপ ১</span>
        </div>
      </div>

      {/* Step 1: SSH Login */}
      <Section
        icon={<Terminal className="h-5 w-5" />}
        title="ধাপ ১: সার্ভারে SSH দিয়ে লগইন করা"
        badge="ধাপ ১"
      >
        <p>
          আপনার কম্পিউটারের <strong className={s.strong}>Terminal</strong> (Mac/Linux) অথবা <strong className={s.strong}>Command Prompt / PowerShell</strong> (Windows) খুলুন। তারপর নিচের কমান্ড চালান:
        </p>
        <p className="text-amber-200/90 mb-2">
          <strong className={s.strong}>YOUR_SERVER_IP</strong> এর জায়গায় আপনার সার্ভারের IPv4 এড্রেস দিন (যেমন: <code className={s.inline}>46.225.230.71</code>)
        </p>
        <CodeBlock code={CMD_SSH_LOGIN} id="ssh-login" />
        <div className={s.note}>
          <strong className="text-amber-300">নোট:</strong> যদি <code className={s.inline}>root</code> ছাড়া অন্য ইউজার ব্যবহার করেন তবে <code className={s.inline}>root</code> এর জায়গায় সেই ইউজারনেম লিখুন।
        </div>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">প্রথমবার SSH connect করলে</h4>
        <p>প্রথমবার connect করার সময় SSH host key verify করার জন্য জিজ্ঞেস করবে। <strong className={s.strong}>yes</strong> টাইপ করে Enter চাপুন।</p>
        <CodeBlock code={CMD_SSH_FIRST_TIME} id="ssh-first" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">পাসওয়ার্ড দিন</h4>
        <p>পাসওয়ার্ড টাইপ করার সময় স্ক্রিনে কিছু দেখাবে না – এটা নিরাপত্তার জন্য স্বাভাবিক। সঠিক পাসওয়ার্ড টাইপ করে Enter চাপুন।</p>
        <CodeBlock code={CMD_PASSWORD_PROMPT} id="ssh-password" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">সফল লগইন</h4>
        <p>
          লগইন সফল হলে প্রম্পট <code className={s.inline}>[root@hostname ~]#</code> এর মতো দেখাবে। এর মানে আপনি সার্ভারে root হিসেবে লগইন হয়েছেন।
        </p>
        <CodeBlock code={CMD_SUCCESS_PROMPT} id="ssh-success" />

        <div className={s.tip}>
          <strong className="text-emerald-400">পরবর্তী:</strong> লগইন সফল হলে ধাপ ২ এ সার্ভার প্রস্তুত করুন।
        </div>
      </Section>

      {/* ধাপ ২: Server প্রস্তুত করা */}
      <Section
        icon={<Package className="h-5 w-5" />}
        title="ধাপ ২: সার্ভার প্রস্তুত করা (Git, Node.js, MySQL, Repo, PM2)"
        badge="ধাপ ২"
      >
        <p>
          খালি সার্ভারে প্রথমে প্রয়োজনীয় সফটওয়্যার ইন্সটল করে repo ক্লোন ও সেটআপ করতে হবে। <strong className={s.strong}>AlmaLinux / RHEL / CentOS</strong> এর জন্য নিচের কমান্ডগুলো ধাপে ধাপে চালান।
        </p>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.১ Git ইন্সটল</h4>
        <CodeBlock code={CMD_INSTALL_GIT} id="install-git" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.২ Node.js 20 ইন্সটল</h4>
        <CodeBlock code={CMD_INSTALL_NODE} id="install-node" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৩ MySQL ইন্সটল (ঐচ্ছিক – যদি local DB চান)</h4>
        <p>যদি আলাদা MySQL সার্ভার বা ডাটাবেজ থাকেই তাহলে এই ধাপ বাদ দিন।</p>
        <CodeBlock code={CMD_INSTALL_MYSQL} id="install-mysql" />
        <div className={s.note}>
          <h5 className="text-amber-300 font-medium mb-2">mysql_secure_installation – সাধারণ প্রশ্ন ও উত্তর</h5>
          <p className="mb-2"><strong className="text-amber-300">Change the root password? [Y/n]</strong> → <strong>Y (Yes)</strong> চাপুন। আগে পাসওয়ার্ড না দিলেও এবার সেট করুন। কারণ: (১) পাসওয়ার্ড ছাড়া root অ্যাকাউন্ট নিরাপদ নয়, (২) Omni app এর DATABASE_URL এ এই পাসওয়ার্ড লাগবে: <code className={s.inline}>mysql://root:YOUR_PASSWORD@localhost:3306/omni_db</code></p>
          <p className="mb-2"><strong className="text-amber-300">Switch to unix_socket authentication [Y/n]</strong> → <strong>n (No)</strong> চাপুন। root পাসওয়ার্ড দিয়ে connect থাকবে, অ্যাপ localhost দিয়ে DB use করতে পারবে।</p>
          <p>অন্যান্য প্রশ্নে (remove anonymous users, disallow root login remotely, remove test database) সাধারণত <strong>Y</strong> চাপুন – নিরাপত্তার জন্য।</p>
        </div>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৪ Database তৈরি</h4>
        <CodeBlock code={CMD_CREATE_DB} id="create-db" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৫ Repo ক্লোন</h4>
        <CodeBlock code={CMD_CLONE_REPO} id="clone-repo" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৬ .env ফাইল তৈরি</h4>
        <p>পুরো কমান্ড কপি করে পেস্ট করুন। <code className={s.inline}>&gt;</code> দেখলে বাকি লাইনগুলো ও শেষে <code className={s.inline}>ENVEOF</code> পেস্ট করুন। পাসওয়ার্ডে <code className={s.inline}>@</code> থাকলে <code className={s.inline}>%40</code> লিখুন।</p>
        <CodeBlock code={CMD_ENV_EXAMPLE} id="env-example" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৭ PM2 ইন্সটল</h4>
        <CodeBlock code={CMD_INSTALL_PM2} id="install-pm2" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৮ প্রথমবার Build ও Migration</h4>
        <p>Build চলার সময় TypeScript warning দেখলে ভয় পাবেন না। <code className={s.inline}>dist/</code> ফোল্ডার ও <code className={s.inline}>server.js</code> তৈরি হয়েছে কিনা <code className={s.inline}>ls -la ~/omni-repo/server/dist/</code> দিয়ে চেক করুন।</p>
        <CodeBlock code={CMD_FIRST_BUILD} id="first-build" />

        <h4 className="text-amber-200 font-medium mt-4 mb-2">২.৯ PM2 দিয়ে Server চালু</h4>
        <CodeBlock code={CMD_PM2_START} id="pm2-start" />

        <div className={s.tip}>
          <strong className="text-emerald-400">পরবর্তী:</strong> সার্ভার প্রস্তুত হলে ধাপ ৩ এ GitHub Secrets সেট করুন। তারপর <code className={s.inline}>git push</code> করলেই অটো ডিপ্লয় হবে।
        </div>
      </Section>

      {/* GitHub Secrets - ধাপ ৩ */}
      <Section
        icon={<Server className="h-5 w-5" />}
        title="ধাপ ৩: GitHub Secrets সেটআপ (পুশ করলেই অটো ডিপ্লয়)"
        badge="CI/CD"
      >
        <p>
          <strong className={s.strong}>git push origin main</strong> করলেই GitHub Actions অটোমেটিকভাবে build, deploy, migration ও restart করবে। এর জন্য GitHub এ Secrets সেট করতে হবে।
        </p>
        <h4 className="text-amber-200 font-medium mt-4 mb-2">কোথায় সেট করবেন</h4>
        <p>GitHub → আপনার Repository → <strong className={s.strong}>Settings</strong> → <strong className={s.strong}>Secrets and variables</strong> → <strong className={s.strong}>Actions</strong> → <strong className={s.strong}>New repository secret</strong></p>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">প্রয়োজনীয় Secrets (কপি করুন)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-amber-500/20 rounded-lg">
            <thead>
              <tr className="border-b border-amber-500/20">
                <th className="text-left p-3 text-amber-300">Secret নাম</th>
                <th className="text-left p-3 text-amber-300">মান</th>
                <th className="text-left p-3 text-amber-300">বাধ্যতামূলক?</th>
              </tr>
            </thead>
            <tbody className="text-amber-200/80">
              <tr className="border-b border-amber-500/10">
                <td className="p-3 font-mono">VPS_HOST</td>
                <td className="p-3">সার্ভার IP (যেমন: 46.225.230.71)</td>
                <td className="p-3">হ্যাঁ</td>
              </tr>
              <tr className="border-b border-amber-500/10">
                <td className="p-3 font-mono">VPS_SSH_PRIVATE_KEY</td>
                <td className="p-3">SSH private key এর পুরো কনটেন্ট</td>
                <td className="p-3">হ্যাঁ</td>
              </tr>
              <tr className="border-b border-amber-500/10">
                <td className="p-3 font-mono">VPS_USER</td>
                <td className="p-3">SSH ইউজার (default: root)</td>
                <td className="p-3">না</td>
              </tr>
              <tr className="border-b border-amber-500/10">
                <td className="p-3 font-mono">VPS_SSH_PORT</td>
                <td className="p-3">SSH পোর্ট (default: 22)</td>
                <td className="p-3">না</td>
              </tr>
              <tr className="border-b border-amber-500/10">
                <td className="p-3 font-mono">VITE_API_URL</td>
                <td className="p-3">API URL (যেমন: https://imoics.com/api)</td>
                <td className="p-3">না (default আছে)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">SSH Key বানানো (যদি না থাকে)</h4>
        <CodeBlock code={CMD_SSH_KEY_GEN} id="ssh-keygen" />
        <p className="mt-2">Private key (<code className={s.inline}>omni_deploy</code>) এর পুরো কনটেন্ট কপি করে <strong className={s.strong}>VPS_SSH_PRIVATE_KEY</strong> তে পেস্ট করুন।</p>

        <h4 className="text-amber-200 font-medium mt-4 mb-2">Public key সার্ভারে যোগ করা</h4>
        <CodeBlock code={CMD_SSH_COPY_ID} id="ssh-copy-id" />
        <p className="mt-2">অথবা সার্ভারের <code className={s.inline}>~/.ssh/authorized_keys</code> ফাইলে public key যুক্ত করুন।</p>

        <div className={s.tip}>
          <strong className="text-emerald-400">পুশের পর:</strong> <code className={s.inline}>git push origin main</code> করলে GitHub Actions → Actions ট্যাবে গিয়ে workflow run দেখতে পারবেন।
        </div>
      </Section>

      {/* Optional: Nginx, Domain */}
      <div className="p-5 rounded-xl border border-amber-500/10 bg-slate-800/20 text-amber-200/60 text-sm text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-amber-500/60" />
        <p>Nginx রিভার্স প্রক্সি, Domain ও SSL সেটআপ শীঘ্রই যোগ করা হবে।</p>
      </div>
    </div>
  );
}
