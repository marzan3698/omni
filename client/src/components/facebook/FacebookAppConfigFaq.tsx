import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { headerApi } from '@/lib/api';
import { getImageUrl, downloadLogoAs1024Png } from '@/lib/imageUtils';
import { HelpCircle } from 'lucide-react';
import { FacebookAppConfigFaqStep1 } from './FacebookAppConfigFaqStep1';
import { FacebookAppConfigFaqStep2 } from './FacebookAppConfigFaqStep2';
import { FacebookAppConfigFaqStep3 } from './FacebookAppConfigFaqStep3';

interface FacebookAppConfigFaqProps {
  baseUrl: string;
  appDomain: string | null;
  verifyToken: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  companyId?: number;
}

export function FacebookAppConfigFaq({
  baseUrl,
  appDomain,
  verifyToken,
  copied,
  onCopy,
  companyId = 1,
}: FacebookAppConfigFaqProps) {
  const base = baseUrl.replace(/\/$/, '');
  const privacyUrl = `${base}/privacy-policy`;
  const termsUrl = `${base}/terms-of-service`;
  const deletionUrl = `${base}/user-data-deletion`;
  const oauthRedirectUri = `${base}/api/integrations/facebook/callback`;
  const webhookCallbackUrl = `${base}/api/webhooks/facebook`;
  const domainForApp =
    appDomain ||
    (() => {
      try {
        return new URL(base).host;
      } catch {
        return base;
      }
    })();

  const { data: headerSettings } = useQuery({
    queryKey: ['header-settings-faq', companyId],
    queryFn: async () => {
      const res = await headerApi.getHeaderSettings();
      return res.data?.data as { logo?: string | null } | undefined;
    },
    staleTime: 60000,
  });

  const logoPath = headerSettings?.logo;
  const logoFullUrl = logoPath ? getImageUrl(logoPath) : '';

  const handleDownload1024 = async () => {
    if (!logoFullUrl) return;
    try {
      await downloadLogoAs1024Png(logoFullUrl);
    } catch (e) {
      console.error(e);
      alert('ডাউনলোড ব্যর্থ। লোগো লোড করুন অথবা CORS চেক করুন।');
    }
  };

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          FAQ — Facebook Basic Settings পূরণের গাইড
        </CardTitle>
        <CardDescription>
          Facebook Developer → App settings → Basic এবং Facebook Login for Business → Settings পেজে কী কী বসাতে হবে — নিচে ক্লিক করে দেখুন ও কপি করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 font-medium text-slate-800">
            <span className="text-indigo-600">Step 1:</span> Basic Setup (App Domains, Privacy, Terms, Data Deletion, App Icon)
          </summary>
          <FacebookAppConfigFaqStep1
            domainForApp={domainForApp}
            privacyUrl={privacyUrl}
            termsUrl={termsUrl}
            deletionUrl={deletionUrl}
            logoPath={logoPath ?? null}
            logoFullUrl={logoFullUrl}
            onDownload1024={handleDownload1024}
            copied={copied}
            onCopy={onCopy}
          />
        </details>
        <details className="group mt-2">
          <summary className="cursor-pointer list-none flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 font-medium text-slate-800">
            <span className="text-indigo-600">Step 2:</span> Facebook Login for Business → Settings
          </summary>
          <FacebookAppConfigFaqStep2
            oauthRedirectUri={oauthRedirectUri}
            dataDeletionUrl={deletionUrl}
            domainForApp={domainForApp}
            copied={copied}
            onCopy={onCopy}
          />
        </details>
        <details className="group mt-2">
          <summary className="cursor-pointer list-none flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 font-medium text-slate-800">
            <span className="text-indigo-600">Step 3:</span> Use cases → Customize → Messenger API Setup
          </summary>
          <FacebookAppConfigFaqStep3
            webhookCallbackUrl={webhookCallbackUrl}
            verifyToken={verifyToken}
            copied={copied}
            onCopy={onCopy}
          />
        </details>
      </CardContent>
    </Card>
  );
}
