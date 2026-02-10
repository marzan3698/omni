import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CopyOpenRow } from './FacebookAppConfigFaqRow';
import { Download } from 'lucide-react';

interface FacebookAppConfigFaqStep1Props {
  domainForApp: string;
  privacyUrl: string;
  termsUrl: string;
  deletionUrl: string;
  logoPath: string | null;
  logoFullUrl: string;
  onDownload1024: () => void;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

export function FacebookAppConfigFaqStep1({
  domainForApp,
  privacyUrl,
  termsUrl,
  deletionUrl,
  logoPath,
  logoFullUrl,
  onDownload1024,
  copied,
  onCopy,
}: FacebookAppConfigFaqStep1Props) {
  return (
    <div className="mt-4 space-y-4 pl-1 border-l-2 border-indigo-100 ml-2 pl-4">
      <p className="text-sm text-gray-600">
        Facebook App Dashboard → App settings → Basic এ নিচের মানগুলো কপি করে বসান।
      </p>
      <CopyOpenRow
        label="App Domains — শুধু ডোমেইন (protocol ছাড়া)"
        value={domainForApp}
        copyKey="faq-app-domain"
        copied={copied}
        onCopy={onCopy}
      />
      <CopyOpenRow
        label="Privacy Policy URL"
        value={privacyUrl}
        copyKey="faq-privacy"
        copied={copied}
        onCopy={onCopy}
        showOpen
      />
      <CopyOpenRow
        label="Terms of Service URL"
        value={termsUrl}
        copyKey="faq-terms"
        copied={copied}
        onCopy={onCopy}
        showOpen
      />
      <CopyOpenRow
        label="User Data Deletion URL"
        value={deletionUrl}
        copyKey="faq-deletion"
        copied={copied}
        onCopy={onCopy}
        showOpen
      />
      <div>
        <Label className="text-xs text-gray-500">App Icon 1024×1024 (Facebook Basic Settings)</Label>
        <p className="text-xs text-gray-600 mt-0.5 mb-2">
          Theme → Header Logo থেকে 1024×1024 PNG ডাউনলোড করুন এবং Facebook এ আপলোড করুন।
        </p>
        {logoPath ? (
          <div className="flex items-center gap-3">
            <img
              src={logoFullUrl}
              alt="Company logo"
              className="h-16 w-16 object-contain border rounded bg-gray-50"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownload1024}
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              1024×1024 PNG ডাউনলোড
            </Button>
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
            Header Logo সেট করা নেই। Theme Design → Manage Header এ গিয়ে লোগো আপলোড করুন।
          </p>
        )}
      </div>
      <p className="text-xs text-gray-500 pt-2">
        ngrok URL পরিবর্তন হলে App Domains ও Valid OAuth Redirect URIs আপডেট করতে ভুলবেন না।
      </p>
    </div>
  );
}
