import { CopyOpenRow } from './FacebookAppConfigFaqRow';
import { Check } from 'lucide-react';

interface FacebookAppConfigFaqStep3Props {
  webhookCallbackUrl: string;
  verifyToken: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

export function FacebookAppConfigFaqStep3({
  webhookCallbackUrl,
  verifyToken,
  copied,
  onCopy,
}: FacebookAppConfigFaqStep3Props) {
  const requiredFields = [
    { name: 'messages', note: null },
    { name: 'message_deliveries', note: 'ভুল নাম messaging_deliveries ব্যবহার করবেন না' },
    { name: 'message_reads', note: 'ভুল নাম messaging_reads ব্যবহার করবেন না' },
    { name: 'messaging_postbacks', note: null },
    { name: 'messaging_optins', note: null },
  ];

  if (!verifyToken) {
    return (
      <div className="mt-4 space-y-4 pl-1 border-l-2 border-indigo-100 ml-2 pl-4">
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
          প্রথমে উপরের Credentials ফর্মে Verify Token সেভ করুন, তারপর এখানে দেখাবে।
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 pl-1 border-l-2 border-indigo-100 ml-2 pl-4">
      <p className="text-sm text-gray-600">
        বাম মেনুতে <strong>Use cases</strong> → <strong>Customize</strong> → <strong>Messenger API Setup</strong> এ যান।
        <span className="block mt-1 text-xs text-slate-500">
          (বা &quot;Engage with customers on Messenger from Meta&quot; → Customize → Messenger API Settings)
        </span>
      </p>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">১. Configure webhooks</p>
        <CopyOpenRow
          label="Callback URL"
          value={webhookCallbackUrl}
          copyKey="faq-messenger-callback"
          copied={copied}
          onCopy={onCopy}
          showOpen
        />
        <CopyOpenRow
          label="Verify token"
          value={verifyToken}
          copyKey="faq-messenger-verify"
          copied={copied}
          onCopy={onCopy}
        />
        <p className="text-sm text-slate-600">
          উভয় মান বসানোর পর নিচের <strong>Webhook fields</strong> টেবিলে যান।
        </p>
        <p className="text-xs text-slate-500">
          Verify token অবশ্যই Omni Credentials → Verify Token এর সাথে মিলতে হবে।
        </p>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs font-medium text-blue-800">Webhook fields টেবিলে কী করবেন:</p>
          <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
            <li>ঊর্ধ্বে যে ফিল্ডগুলো দেখা যাচ্ছে (affiliation, attire, awards, email, feed, general_info, leadgen ইত্যাদি) সেগুলো <strong>এনাবল করবেন না</strong> — এগুলো Messenger মেসেজের জন্য নয়।</li>
            <li><strong>নিচে স্ক্রল</strong> করে messaging ফিল্ডগুলো খুঁজে বের করুন।</li>
            <li>নিচের অবশ্য ফিল্ডগুলো Subscribe করুন: messages, message_deliveries, message_reads, messaging_postbacks, messaging_optins।</li>
            <li>ঐচ্ছিক: message_echoes।</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            তারপর <strong>Verify and save</strong> বাটনে ক্লিক করুন।
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">২. Add Page Subscriptions</p>
        <p className="text-sm text-gray-600">
          &quot;2. Generate access tokens&quot; সেকশনে প্রতিটি পেজের পাশে <strong>Add Subscriptions</strong> ক্লিক করুন।
        </p>
        <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs font-medium text-slate-700">অবশ্য ফিল্ড (checklist):</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {requiredFields.map(({ name, note }) => (
              <li key={name} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-600" />
                <span>
                  <code className="bg-slate-200 px-1 rounded">{name}</code>
                  {note && (
                    <span className="block mt-0.5 text-amber-700">
                      {note}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            ঐচ্ছিক: <code className="bg-slate-200 px-1 rounded">message_echoes</code>
          </p>
        </div>
        <p className="text-sm text-slate-600">
          তারপর <strong>Confirm</strong> ক্লিক করুন।
        </p>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs font-medium text-amber-800">সমস্যা হলে:</p>
        <p className="text-xs text-amber-700 mt-1">
          ngrok URL পরিবর্তন হলে Callback URL আপডেট করতে হবে; Verify and save আবার করুন।
        </p>
      </div>
    </div>
  );
}
