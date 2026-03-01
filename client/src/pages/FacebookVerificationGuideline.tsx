import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy, Check, FileText, CheckCircle2, ExternalLink, Shield, MessageSquare, Globe } from 'lucide-react';

// ─── Copyable content constants (Facebook App Review form use) ─────────────────

const APP_USE_CASE = `Omni CRM is an Enterprise Management System that helps businesses manage customer communications. The pages_messaging permission is used to receive and send Facebook Page messages directly in the unified inbox, allowing support teams to reply to customers from a single dashboard.`;

const COMPANY_DESCRIPTION = `IMOICS develops Omni CRM, an enterprise CRM/ERP platform. We provide software for sales, leads, projects, finance, and multi-channel inbox (Facebook Messenger, Chatwoot). Website: https://imoics.com`;

const PERMISSION_JUSTIFICATION = `Our app uses pages_messaging to:
- Receive real-time Facebook Page messages in a unified inbox
- Send replies to customers from within Omni CRM
- Enable support teams to manage multiple channels (Facebook, Chatwoot) from one dashboard
- Convert conversations into leads and track customer interactions`;

const TEST_CREDENTIALS_PLACEHOLDER = `Test Account Email: admin@imoics.com
Test Account Password: [Your demo password - create a separate demo account for reviewers]

Optional: Login at https://imoics.com/login then go to Inbox to see Facebook messages.`;

const WEBHOOK_URL_EXAMPLE = `https://imoics.com/api/webhooks/facebook`;

const WEBHOOK_VERIFY_CURL = `curl "https://imoics.com/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function FacebookVerificationGuideline() {
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
    warn: 'p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs',
    tip: 'p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs',
    note: 'p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs',
    link: 'text-amber-400 hover:text-amber-300 underline',
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
          <FileText className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-amber-100">Facebook Verification Step Guideline</h1>
        </div>
        <p className="text-amber-200/70 text-sm">
          Meta App Review সফলভাবে সম্পন্ন করার ধাপে ধাপে গাইড। কোম্পানি ও সফটওয়্যার সম্পর্কে copy-paste-ready টেক্সট যা Facebook App Review ফর্মে সরাসরি ব্যবহার করা যাবে।
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={s.badge('border-blue-500/40 text-blue-300 bg-blue-500/10')}>pages_messaging</span>
          <span className={s.badge('border-purple-500/40 text-purple-300 bg-purple-500/10')}>Webhook</span>
          <span className={s.badge('border-emerald-500/40 text-emerald-300 bg-emerald-500/10')}>Free App Review</span>
        </div>
      </div>

      {/* Prerequisites */}
      <Section
        icon={<Shield className="h-5 w-5" />}
        title="প্রয়োজনীয়তা (Prerequisites)"
        badge="ধাপ ০"
      >
        <ul className="list-disc list-inside space-y-1">
          <li>Webhook URL (HTTPS বাধ্যতামূলক): <code className={s.inline}>https://yourdomain.com/api/webhooks/facebook</code></li>
          <li>Verify Token – App Config এ সেট করা টোকেন যা Facebook Webhook verification এ মিলবে</li>
          <li>Facebook Page Published থাকতে হবে</li>
          <li>App ID, App Secret – [Settings → Facebook App Config] থেকে কনফিগার করুন</li>
        </ul>
      </Section>

      {/* Step 1 */}
      <Section
        icon={<MessageSquare className="h-5 w-5" />}
        title="ধাপ ১: App তৈরি ও Messenger যোগ করা"
        badge="ধাপ ১"
      >
        <p>Meta Developers এ নতুন App তৈরি করুন অথবা existing app ব্যবহার করুন। Use Case হিসেবে <strong className={s.strong}>Manage everything on your Page</strong> বা <strong className={s.strong}>Other</strong> সিলেক্ট করুন। এরপর <strong className={s.strong}>Messenger</strong> প্রোডাক্ট যোগ করে Webhook কনফিগার করুন।</p>
        <p className={s.note}>Callback URL এবং Verify Token [Settings → Facebook App Config] পেজে দেখতে পারবেন।</p>
      </Section>

      {/* Step 2 */}
      <Section
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="ধাপ ২: pages_messaging Permission রিকোয়েস্ট"
        badge="ধাপ ২"
      >
        <p>App Dashboard → App Review → Permissions and Features এ গিয়ে <strong className={s.strong}>pages_messaging</strong> permission রিকোয়েস্ট করুন। Facebook ফর্মে নিচের টেক্সটগুলো কপি করে পেস্ট করতে পারবেন।</p>
      </Section>

      {/* Step 3: App Use Case - Copyable */}
      <Section
        icon={<MessageSquare className="h-5 w-5" />}
        title="App Use Case – কপি করুন (How does your app use this permission?)"
        badge="Copy"
      >
        <p className="text-amber-200/90 mb-3">Facebook App Review ফর্মে "How does your app use this permission?" ফিল্ডে এই টেক্সট পেস্ট করুন:</p>
        <CodeBlock code={APP_USE_CASE} id="app-use-case" />
      </Section>

      {/* Step 4: Company Description - Copyable */}
      <Section
        icon={<Globe className="h-5 w-5" />}
        title="কোম্পানি সম্পর্কে – কপি করুন (Company/Developer Info)"
        badge="Copy"
      >
        <p className="text-amber-200/90 mb-3">App Review submission বা Business Verification এ Company/Developer বর্ণনা হিসেবে ব্যবহার করুন:</p>
        <CodeBlock code={COMPANY_DESCRIPTION} id="company-desc" />
      </Section>

      {/* Permission Justification - Extended */}
      <Section
        icon={<FileText className="h-5 w-5" />}
        title="Permission Justification – বিস্তারিত (Extended)"
        badge="Copy"
      >
        <p className="text-amber-200/90 mb-3">যদি Facebook আরো বিস্তারিত বর্ণনা চায় তাহলে এটা ব্যবহার করুন:</p>
        <CodeBlock code={PERMISSION_JUSTIFICATION} id="permission-justification" />
      </Section>

      {/* Step 5: Test Credentials */}
      <Section
        icon={<Shield className="h-5 w-5" />}
        title="টেস্ট ক্রেডেনশিয়াল (Test Credentials for Review Team)"
        badge="ধাপ ৫"
      >
        <p>রিভিউ টিমের জন্য লগইন তথ্য দিতে হবে যদি অ্যাপে gated content থাকে। নিচের টেমপ্লেটটি সম্পাদন করে Submission Notes এ দিন:</p>
        <CodeBlock code={TEST_CREDENTIALS_PLACEHOLDER} id="test-credentials" />
      </Section>

      {/* Step 6: Pre-submission Checklist */}
      <Section
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="Pre-submission চেকলিস্ট"
        badge="ধাপ ৬"
      >
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Webhook <strong className={s.strong}>200 OK</strong> রেসপন্স ২০ সেকেন্ডের মধ্যে দেয় কিনা যাচাই করুন</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Facebook Page <strong className={s.strong}>Published</strong> আছে কিনা</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong className={s.strong}>Community Standards</strong> ও <strong className={s.strong}>Platform policies</strong> মেনে চলা</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Email notification settings সঠিক আছে কিনা (Meta Developers)</span>
          </li>
        </ul>
      </Section>

      {/* Webhook URLs */}
      <Section
        icon={<MessageSquare className="h-5 w-5" />}
        title="Webhook URL ও Verification টেস্ট"
      >
        <p>Production Webhook URL (আপনার domain দিয়ে replace করুন):</p>
        <CodeBlock code={WEBHOOK_URL_EXAMPLE} id="webhook-url" />
        <p className="mt-3">Webhook verification টেস্ট (GET request – Verify Token দিয়ে replace করুন):</p>
        <CodeBlock code={WEBHOOK_VERIFY_CURL} id="webhook-verify" />
      </Section>

      {/* Reference Links */}
      <Section
        icon={<ExternalLink className="h-5 w-5" />}
        title="অফিসিয়াল রেফারেন্স লিংক"
      >
        <ul className="space-y-2">
          <li>
            <a href="https://developers.facebook.com/docs/resp-plat-initiatives/app-review/" target="_blank" rel="noopener noreferrer" className={s.link}>
              Meta App Review
            </a>
          </li>
          <li>
            <a href="https://developers.facebook.com/docs/messenger-platform/app-review/" target="_blank" rel="noopener noreferrer" className={s.link}>
              Messenger Platform App Review
            </a>
          </li>
          <li>
            <a href="https://developers.facebook.com/docs/messenger-platform/product-overview/launch" target="_blank" rel="noopener noreferrer" className={s.link}>
              Pre-launch Checklist
            </a>
          </li>
          <li>
            <a href="https://developers.facebook.com/devpolicy#messengerplatform" target="_blank" rel="noopener noreferrer" className={s.link}>
              Platform Policies (Messenger)
            </a>
          </li>
          <li>
            <a href="https://developers.facebook.com/docs/permissions/reference/pages_messaging" target="_blank" rel="noopener noreferrer" className={s.link}>
              pages_messaging Permission
            </a>
          </li>
        </ul>
      </Section>
    </div>
  );
}
