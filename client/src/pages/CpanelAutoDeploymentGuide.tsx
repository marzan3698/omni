import { useState } from 'react';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, Copy, Check } from 'lucide-react';

const ENV_FILE_CONTENT = `PORT=5001
NODE_ENV=production
DATABASE_URL=mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/YOUR_DB_NAME
JWT_SECRET=your-long-random-secret-at-least-32-characters
CLIENT_URL=https://imoics.com`;

const EXAMPLE_DATABASE_URL = 'mysql://imocis_omni_user:OmniDB2024Secure@localhost:3306/imocis_omni_db';

const SUGGESTED_PASSWORDS = ['OmniDB2024Secure', 'Im0c1s0mni2024', 'OmniSecure@DB24'];

const TOUCH_ENV_CMD = 'cd /home/imocis/public_html/omni/server && touch .env';

export default function CpanelAutoDeploymentGuide() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const codeBlock = 'rounded-lg border border-amber-500/20 bg-slate-800/80 overflow-hidden';
  const codeText = 'p-4 pr-12 text-sm overflow-x-auto font-mono text-amber-100';
  const detailsStyle = 'group rounded-lg border border-amber-500/20 bg-slate-800/40 hover:bg-amber-500/5 transition-colors';
  const summaryStyle = 'cursor-pointer list-none flex items-center justify-between gap-2 py-4 px-4 font-medium text-amber-100';
  const contentStyle = 'px-4 pb-4 pt-0 text-amber-200/80 text-sm space-y-3';
  const strongStyle = 'text-amber-300 font-semibold';
  const codeInline = 'px-1.5 py-0.5 bg-amber-500/20 rounded text-amber-200 border border-amber-500/30';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold text-amber-100">Cpanel Auto Deployment গাইড</h1>
        <p className="text-amber-200/80 mt-1">
          cPanel দিয়ে অটো ডিপ্লয়মেন্ট সেটআপ সম্পর্কিত গাইড ও Frequently Asked Questions।
        </p>
      </div>

      <GamePanel>
        <div className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-100">
            <HelpCircle className="h-5 w-5 text-amber-400" />
            FAQ
          </h2>
          <p className="text-amber-200/70 mt-1 mb-4">সাধারণ প্রশ্ন ও উত্তর। প্রতিটি আইটেমে ক্লিক করে বিস্তারিত দেখুন।</p>
          <div className="space-y-2">
          {/* Overview: cPanel File Structure */}
          <details className={detailsStyle}>
            <summary className={summaryStyle}>
              <span>Overview: cPanel ফাইল স্ট্রাকচার (ডিপ্লয়মেন্টের আগে জানুন)</span>
              <ChevronDown className="h-4 w-4 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className={contentStyle}>
              <p>ডিপ্লয়মেন্ট শুরু করার আগে cPanel File Manager এ ফোল্ডার স্ট্রাকচার চিনে রাখুন।</p>
              <div className="space-y-2">
                <p><strong className={strongStyle}>হোম ডিরেক্টরি:</strong> <code className={codeInline}>/home/imocis</code></p>
                <p><strong className={strongStyle}>মূল ফোল্ডারগুলো:</strong> <code className={codeInline}>etc</code>, <code className={codeInline}>logs</code>, <code className={codeInline}>mail</code>, <code className={codeInline}>public_ftp</code>, <code className={codeInline}>public_html</code>, <code className={codeInline}>ssl</code>, <code className={codeInline}>tmp</code></p>
                <p><strong className={strongStyle}>public_html:</strong> ওয়েবসাইটের মূল রুট। প্রথমে খালি থাকতে পারে। GitHub Actions বা Git দিয়ে কোড এখানে (অথবা এর সাবফোল্ডারে যেমন <code className={codeInline}>api</code>) রাখবেন।</p>
              </div>
            </div>
          </details>

          {/* Step 1: GitHub থেকে কোড cPanel এ আনা */}
          <details className={detailsStyle}>
            <summary className={summaryStyle}>
              <span>Step 1: GitHub থেকে কোড cPanel এ আনা</span>
              <ChevronDown className="h-4 w-4 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className={contentStyle}>
              <p>কোড সিপ্যানেলে আসার আগে Node.js অ্যাপ তৈরি করলে Application root খালি থাকবে। তাই <strong>প্রথমে</strong> কোড আনা জরুরি।</p>
              <div className="space-y-3">
                <div>
                  <strong className={strongStyle}>পদ্ধতি ১ – SSH + Git Clone:</strong>
                  <p className="mt-1">cPanel-এ SSH Access থাকলে Terminal খুলে <code className={codeInline}>cd /home/imocis/public_html</code> করে <code className={codeInline}>git clone https://github.com/marzan3698/omni.git</code> চালান।</p>
                </div>
                <div>
                  <strong className={strongStyle}>পদ্ধতি ২ – GitHub Actions:</strong>
                  <p className="mt-1">প্রজেক্টে GitHub Actions workflow যোগ করে main ব্রাঞ্চে পুশ করলে স্বয়ংক্রিয়ভাবে কোড cPanel-এ আপলোড হবে। এর জন্য GitHub Secrets এ cPanel/SSH credentials সেট করতে হবে।</p>
                </div>
                <div>
                  <strong className={strongStyle}>পদ্ধতি ৩ – FTP/SFTP:</strong>
                  <p className="mt-1">File Manager → Upload অথবা FTP ক্লায়েন্ট (FileZilla ইত্যাদি) দিয়ে জিপ/ফাইল আপলোড করুন।</p>
                </div>
              </div>
              <p className="text-amber-200/60">কোড <code className={codeInline}>public_html</code> বা <code className={codeInline}>public_html/api</code> (ব্যাকেন্ড) ও <code className={codeInline}>public_html</code> (ফ্রন্টেন্ড বিল্ড) স্ট্রাকচার অনুযায়ী রাখুন।</p>
            </div>
          </details>

          {/* Step 2: Database সেটআপ + Server ফোল্ডারে .env ফাইল তৈরি */}
          <details className={detailsStyle}>
            <summary className={summaryStyle}>
              <span>Step 2: ডাটাবেস সেটআপ ও Server ফোল্ডারে .env ফাইল তৈরি</span>
              <ChevronDown className="h-4 w-4 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className={contentStyle}>
              <p className="font-medium text-amber-100">২.১ cPanel এ ডাটাবেস সেটআপ</p>
              <p>প্রথমে cPanel → <strong>Manage My Databases</strong> (বা MySQL Databases) এ গিয়ে নিচের ধাপগুলো করুন।</p>
              <div className="space-y-3 pl-2 border-l-2 border-amber-500/30">
                <div>
                  <strong className={strongStyle}>ডাটাবেস তৈরি:</strong>
                  <p className="mt-1">Create New Database এ শুধু সাফিক্স লিখুন (প্রিফিক্স <code className={codeInline}>imocis_</code> আগে থেকেই থাকে)। যেমন <code className={codeInline}>omni_db</code> লিখলে পুরো নাম হবে <code className={codeInline}>imocis_omni_db</code>। Create Database ক্লিক করুন।</p>
                </div>
                <div>
                  <strong className={strongStyle}>ডাটাবেস ইউজার তৈরি:</strong>
                  <p className="mt-1">Jump to Database Users → Add New User। Username এ প্রিফিক্সের পর অংশ লিখুন (যেমন <code className={codeInline}>omni_user</code> → পুরো <code className={codeInline}>imocis_omni_user</code>)। পাসওয়ার্ডের জন্য নিচের যেকোনো একটি ব্যবহার করতে পারেন (বিশেষ অক্ষর নেই, DATABASE_URL-এ সমস্যা হবে না):</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {SUGGESTED_PASSWORDS.map((pw) => (
                      <li key={pw}><code className={codeInline}>{pw}</code></li>
                    ))}
                  </ul>
                  <p className="mt-1">অথবা Password Generator দিয়ে শক্ত পাসওয়ার্ড নিন এবং <strong>পাসওয়ার্ড কপি করে সেভ করুন</strong>। Create User ক্লিক করুন।</p>
                </div>
                <div>
                  <strong className={strongStyle}>ইউজারকে ডাটাবেসের সাথে যুক্ত করুন:</strong>
                  <p className="mt-1">Add User To Database এ যান। User ও Database সিলেক্ট করে Add করুন। পরের পেজে <strong>ALL PRIVILEGES</strong> সিলেক্ট করে Make Changes/Save করুন।</p>
                </div>
              </div>

              <p className="font-medium text-amber-100 pt-2">২.২ .env ফাইল তৈরি ও কানেক্ট</p>
              <p>Terminal এ চালান:</p>
              <div className={`relative ${codeBlock}`}>
                <pre className={codeText}><code>{TOUCH_ENV_CMD}</code></pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                  onClick={() => copyToClipboard(TOUCH_ENV_CMD, 'touch')}
                  title="Copy"
                >
                  {copiedId === 'touch' ? <Check className="h-4 w-4 text-amber-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p>এরপর cPanel <strong>File Manager</strong> এ যান → <code className={codeInline}>public_html/omni/server/</code> খুলুন → <code className={codeInline}>.env</code> ফাইলটি <strong>Edit</strong> করুন এবং ভিতরে নিচের লাইনগুলো দিন (আপনার ডাটাবেস ও সাইটের মান দিয়ে পরিবর্তন করুন):</p>
              <div className={`relative ${codeBlock}`}>
                <pre className={`${codeText} whitespace-pre`}>{ENV_FILE_CONTENT}</pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                  onClick={() => copyToClipboard(ENV_FILE_CONTENT, 'env')}
                  title="Copy .env content"
                >
                  {copiedId === 'env' ? <Check className="h-4 w-4 text-amber-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p><strong className={strongStyle}>YOUR_DB_USER</strong>, <strong className={strongStyle}>YOUR_DB_PASSWORD</strong>, <strong className={strongStyle}>YOUR_DB_NAME</strong> এবং <strong className={strongStyle}>JWT_SECRET</strong> নিজের মান দিয়ে প্রতিস্থাপন করুন।</p>
              <p className="font-medium text-amber-200/90">উদাহরণ (imocis_omni_db, imocis_omni_user, OmniDB2024Secure):</p>
              <div className={`relative ${codeBlock}`}>
                <pre className={`${codeText} text-xs break-all`}>{EXAMPLE_DATABASE_URL}</pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                  onClick={() => copyToClipboard(EXAMPLE_DATABASE_URL, 'dburl')}
                  title="Copy DATABASE_URL"
                >
                  {copiedId === 'dburl' ? <Check className="h-4 w-4 text-amber-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-amber-200/60">cPanel এ ডাটাবেস ও ইউজার নামে প্রিফিক্স থাকে। DATABASE_URL এ <strong>পুরো নাম</strong> ব্যবহার করুন। পাসওয়ার্ডে বিশেষ অক্ষর থাকলে ভ্যালু কোটেশনে রাখুন। সেভ করে বন্ধ করুন।</p>
            </div>
          </details>

          {/* Step 3: Node.js Create Application */}
          <details className={detailsStyle}>
            <summary className={summaryStyle}>
              <span>Step 3: Node.js Selector – CREATE APPLICATION ফর্ম পূরণ</span>
              <ChevronDown className="h-4 w-4 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className={contentStyle}>
              <p>Step 1 ও 2 সম্পন্ন হওয়ার পর, cPanel → Tools → Node.js → <strong>CREATE APPLICATION</strong> এ গিয়ে নিচের ফিল্ডগুলো পূরণ করুন।</p>

              <div className="space-y-3 text-amber-200/90">
                <div>
                  <strong className={strongStyle}>Node.js version:</strong>
                  <p className="mt-1">সিলেক্ট করুন: <code className={codeInline}>18.x</code> বা <code className={codeInline}>20.x</code> (যদি উপলব্ধ থাকে)। পুরনো 10.x ব্যবহার করবেন না।</p>
                </div>

                <div>
                  <strong className={strongStyle}>Application mode:</strong>
                  <p className="mt-1">Live সাইটের জন্য <code className={codeInline}>Production</code> সিলেক্ট করুন। Development শুধু টেস্টিং-এর জন্য।</p>
                </div>

                <div>
                  <strong className={strongStyle}>Application root:</strong>
                  <p className="mt-1">ব্যাকেন্ড ফাইলগুলো যেখানে থাকবে সেই ফিজিক্যাল পাথ। উদাহরণ:</p>
                  <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                    <li>ব্যাকেন্ড: <code className={codeInline}>/home/imocis/public_html/api</code></li>
                    <li>অথবা: <code className={codeInline}>/home/imocis/omni-api</code></li>
                  </ul>
                  <p className="mt-1 text-amber-200/60">আপনার ডিপ্লয়মেন্ট স্ট্রাকচার অনুযায়ী সঠিক পাথ দিন। ফাইলগুলো GitHub Actions দিয়ে এই ফোল্ডারে আপলোড হবে।</p>
                </div>

                <div>
                  <strong className={strongStyle}>Application URL:</strong>
                  <p className="mt-1">ড্রপডাউন থেকে আপনার ডোমেইন সিলেক্ট করুন (যেমন <code className={codeInline}>imoics.com</code>)।</p>
                  <p className="mt-1">যদি API আলাদা পাথে রান করবে (যেমন <code className={codeInline}>/api</code>), তাহলে ঠিকানা হতে পারে: <code className={codeInline}>imoics.com</code> অথবা <code className={codeInline}>imoics.com/api</code> – আপনার রাউটিং সেটআপ অনুযায়ী।</p>
                </div>

                <div>
                  <strong className={strongStyle}>Application startup file:</strong>
                  <p className="mt-1">নোড অ্যাপ চালু হওয়ার ফাইল। Omni ব্যাকেন্ডের জন্য:</p>
                  <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                    <li>বিল্ড করা অ্যাপ: <code className={codeInline}>dist/server.js</code></li>
                    <li>অথবা ডিরেক্ট: <code className={codeInline}>server.js</code></li>
                  </ul>
                </div>

                <div>
                  <strong className={strongStyle}>Environment variables:</strong>
                  <p className="mt-1">এখানে কোনো ভেরিয়েবল যুক্ত করবেন না। আপনার সব কনফিগ (JWT_SECRET, DATABASE_URL ইত্যাদি) <code className={codeInline}>.env</code> ফাইলে থাকবে এবং অ্যাপ রুট ফোল্ডারে রাখবেন। Environment Variables সেকশন খালি রাখুন ("NO RESULT FOUND" থাকবে)।</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-200 text-xs">
                <strong>মনে রাখুন:</strong> ব্যাকেন্ড ও ফ্রন্টেন্ড দুটো আলাদা Node.js অ্যাপ লাগতে পারে। ফ্রন্টেন্ডের জন্য ভিন্ন Application Root ও Startup file দিতে হবে (যেমন ভাইট বিল্ডের পর <code>server.js</code> বা স্ট্যাটিক সার্ভিং)। এই স্টেপে শুধু ব্যাকেন্ড অ্যাপের সেটআপ করুন।
              </div>
            </div>
          </details>

          {/* Step 4: .env সেটআপ, npm install ও build */}
          <details className={detailsStyle}>
            <summary className={summaryStyle}>
              <span>Step 4: npm install ও build (কনটেন্ট পরে যুক্ত করা হবে)</span>
              <ChevronDown className="h-4 w-4 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-0 text-slate-600 text-sm">
              <p className="text-amber-200/60 italic">এই স্টেপের বিস্তারিত পরে যুক্ত করা হবে।</p>
            </div>
          </details>
          </div>
        </div>
      </GamePanel>
    </div>
  );
}
