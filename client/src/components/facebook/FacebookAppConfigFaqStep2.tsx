import { CopyOpenRow } from './FacebookAppConfigFaqRow';

interface FacebookAppConfigFaqStep2Props {
  oauthRedirectUri: string;
  dataDeletionUrl: string;
  domainForApp: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

export function FacebookAppConfigFaqStep2({
  oauthRedirectUri,
  dataDeletionUrl,
  domainForApp,
  copied,
  onCopy,
}: FacebookAppConfigFaqStep2Props) {
  return (
    <div className="mt-4 space-y-4 pl-1 border-l-2 border-indigo-100 ml-2 pl-4">
      <p className="text-sm text-gray-600">
        বাম মেনুতে <strong>Facebook Login for Business</strong> → <strong>Settings</strong> এ যান। নিচের মানগুলো সেভাবে সেট করুন।
      </p>

      <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-xs font-medium text-slate-700">Client OAuth settings (টগলগুলো এভাবে রাখুন):</p>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>Client OAuth login: <strong>Yes</strong></li>
          <li>Web OAuth login: <strong>Yes</strong></li>
          <li>Enforce HTTPS: <strong>Yes</strong></li>
          <li>Use Strict Mode for redirect URIs: <strong>Yes</strong> (অনুরোধ করা হয়)</li>
          <li>Force Web OAuth reauthentication: No</li>
          <li>Embedded browser OAuth login: No</li>
        </ul>
      </div>

      <CopyOpenRow
        label="Valid OAuth Redirect URIs — এই ঘরে পুরো URL বসান (প্রতিটি লাইন আলাদা হলে যোগ করুন)"
        value={oauthRedirectUri}
        copyKey="faq-oauth-redirect"
        copied={copied}
        onCopy={onCopy}
      />
      <p className="text-xs text-gray-500 -mt-2">
        কোথায়: Facebook Login for Business → Settings → Valid OAuth Redirect URIs টেক্সট এরিয়ায়।
      </p>

      <CopyOpenRow
        label="Data Deletion Request URL — এই ঘরে URL বসান"
        value={dataDeletionUrl}
        copyKey="faq-data-deletion-request"
        copied={copied}
        onCopy={onCopy}
        showOpen
      />
      <p className="text-xs text-gray-500 -mt-2">
        কোথায়: একই Settings পেজে নিচে Data Deletion Requests সেকশনে। Meta ব্যবহারকারী ডেটা ডিলিট রিকোয়েস্ট করলে এখানে পিং করবে।
      </p>

      <div>
        <CopyOpenRow
          label="Allowed Domains for the JavaScript SDK (ঐচ্ছিক — শুধু যদি Login with the JavaScript SDK চালু করেন)"
          value={domainForApp}
          copyKey="faq-allowed-domains"
          copied={copied}
          onCopy={onCopy}
        />
        <p className="text-xs text-gray-500 mt-1">
          Omni-এর বর্তমান ফ্লোতে JavaScript SDK লগইন ব্যবহার হয় না, তাই এটি সাধারণত খালি রাখলেই হয়।
        </p>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs font-medium text-amber-800">সমস্যা হলে:</p>
        <p className="text-xs text-amber-700 mt-1">
          &quot;Can&apos;t load URL&quot; দেখলে ধরে নিন App Domains বা Valid OAuth Redirect URIs মিলছে না অথবা ngrok আবার চালু করায় ডোমেইন বদলেছে। Step 1 থেকে App Domains ও এখান থেকে Valid OAuth Redirect URIs আবার কপি করে Facebook-এ আপডেট করুন, তারপর Save changes চাপুন।
        </p>
      </div>
    </div>
  );
}
