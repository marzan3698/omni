import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { facebookIntegrationApi, type FacebookConfigUrls } from '@/lib/facebookIntegration';
import { FacebookAppConfigFaq } from '@/components/facebook/FacebookAppConfigFaq';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Copy, Check, AlertTriangle, Wifi, Globe } from 'lucide-react';

export function FacebookAppConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [redirectUriOverride, setRedirectUriOverride] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'production'>('local');
  const [productionDomain, setProductionDomain] = useState('');

  const companyId = user?.roleName === 'SuperAdmin' ? undefined : user?.companyId;

  const { data: config, isLoading } = useQuery({
    queryKey: ['facebook-config', companyId],
    queryFn: () => facebookIntegrationApi.getConfig(companyId),
  });

  const { data: urlsData } = useQuery({
    queryKey: ['facebook-config-urls', companyId],
    queryFn: () => facebookIntegrationApi.getConfigUrls(companyId),
    enabled: !!config?.data?.data || !!appId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { appId: string; appSecret: string; verifyToken: string; redirectUriOverride?: string }) =>
      facebookIntegrationApi.updateConfig(data, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-config', companyId] });
      queryClient.invalidateQueries({ queryKey: ['facebook-config-urls', companyId] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const existing = config?.data?.data;
  const hasSyncedFromConfig = useRef(false);

  useEffect(() => {
    if (existing && !hasSyncedFromConfig.current) {
      hasSyncedFromConfig.current = true;
      setAppId(existing.appId || '');
      setVerifyToken(existing.verifyToken || '');
      setRedirectUriOverride(existing.redirectUriOverride || '');
    }
  }, [existing]);

  const urls: FacebookConfigUrls | null = urlsData?.data?.data ?? null;
  const ngrokDomain = urls?.ngrokDomain ?? null;
  const isNgrokRunning = urls?.isNgrokRunning ?? false;
  const isLocalhostWithoutNgrok =
    urls?._debug?.isLocalhost &&
    urls?._debug?.ngrokAttempted &&
    !urls?._debug?.ngrokSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      appId: appId.trim(),
      appSecret: appSecret.trim(),
      verifyToken: verifyToken.trim(),
      redirectUriOverride: redirectUriOverride.trim() || undefined,
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const prodBaseRaw = productionDomain.trim().replace(/\/$/, '');
  const prodBase = prodBaseRaw ? (prodBaseRaw.startsWith('http') ? prodBaseRaw : `https://${prodBaseRaw}`) : '';
  const prodUrls = prodBase && urls ? {
    appDomain: (() => {
      try {
        return new URL(prodBase).host;
      } catch {
        return prodBase;
      }
    })(),
    webhookCallbackUrl: `${prodBase}/api/webhooks/facebook`,
    oauthRedirectUri: `${prodBase}/api/integrations/facebook/callback`,
    verifyToken: urls.verifyToken,
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const inputClass = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1';
  const labelClass = 'text-amber-200/90';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold text-amber-100">Facebook App Config</h1>
        <p className="text-amber-200/80 mt-1">
          Set App ID, App Secret and Verify Token so you can connect Facebook Pages from Integrations.
        </p>
      </div>

      <GamePanel>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-amber-100">Credentials</h2>
          <p className="text-sm text-amber-200/70 mt-1">
            From Facebook Developer Console → Your App → Settings → Basic. Verify Token can be any string you choose.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="appId" className={labelClass}>App ID</Label>
              <Input id="appId" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="e.g. 123456789" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="appSecret" className={labelClass}>App Secret</Label>
              <Input id="appSecret" type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder={existing?.hasAppSecret ? '••••••••' : 'Enter to set or change'} className={inputClass} />
              {existing?.hasAppSecret && <p className="text-xs text-amber-200/60 mt-1">Leave blank to keep current secret</p>}
            </div>
            <div>
              <Label htmlFor="verifyToken" className={labelClass}>Verify Token</Label>
              <Input id="verifyToken" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="e.g. my_webhook_verify_token" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="redirectUriOverride" className={labelClass}>Redirect URI override (optional)</Label>
              <Input id="redirectUriOverride" value={redirectUriOverride} onChange={(e) => setRedirectUriOverride(e.target.value)} placeholder="Leave blank to use default" className={inputClass} />
            </div>
            <Button type="submit" disabled={updateMutation.isPending || !appId.trim() || !verifyToken.trim()} className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save config
            </Button>
            {updateMutation.isSuccess && (
              <span className="ml-2 text-sm text-amber-300">Saved. Go to Integrations to connect Facebook Pages.</span>
            )}
            {updateMutation.isError && (
              <span className="ml-2 text-sm text-red-400">
                {(updateMutation.error as any)?.response?.data?.message || 'Save failed'}
              </span>
            )}
          </form>
        </div>
      </GamePanel>

      {urls && (
        <>
          <FacebookAppConfigFaq
            baseUrl={activeTab === 'production' && prodBase ? prodBase : (urls.baseUrl || urls.webhookCallbackUrl.replace(/\/api\/webhooks\/facebook$/, ''))}
            appDomain={
              activeTab === 'production' && prodUrls
                ? prodUrls.appDomain
                : ngrokDomain || (() => {
                    try {
                      const b = urls.baseUrl || urls.webhookCallbackUrl.replace(/\/api\/webhooks\/facebook$/, '');
                      return new URL(b).host;
                    } catch {
                      return '';
                    }
                  })()
            }
            verifyToken={urls.verifyToken ?? ''}
            copied={copied}
            onCopy={copyToClipboard}
            companyId={companyId ?? 1}
          />
          <GamePanel>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-amber-100">Environment &amp; Base URL</h2>
              <p className="text-sm text-amber-200/70 mt-1">
                বর্তমানে কোন Base URL ব্যবহার হচ্ছে। লোকালহোস্টে ngrok চালু থাকলে অটো-ডিটেক্ট হয়। ডোমেইনে cPanel Node.js environment-এর API_URL / PUBLIC_URL ব্যবহার করুন。
              </p>
              <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">ngrok স্ট্যাটাস:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isNgrokRunning ? 'bg-green-500/25 text-green-300 border-green-500/30' : 'bg-amber-500/25 text-amber-200 border-amber-500/30'
                  }`}
                >
                  {isNgrokRunning ? <Wifi className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {isNgrokRunning ? 'ngrok চালু আছে' : 'ngrok চালু নেই'}
                </span>
              </div>
              {ngrokDomain && (
                <div>
                  <Label className="text-xs text-amber-200/70">App Domains এ বসান (Facebook Basic Settings) — কপি করুন</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={ngrokDomain} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ngrokDomain, 'ngrok-domain')}
                      title="কপি করুন"
                    >
                      {copied === 'ngrok-domain' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-amber-200/70">Current Base URL (source: {urls.source || 'request'})</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={urls.baseUrl || urls.webhookCallbackUrl.replace(/\/api\/webhooks\/facebook$/, '')} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(urls.baseUrl || urls.webhookCallbackUrl.replace(/\/api\/webhooks\/facebook$/, ''), 'base')}
                  >
                    {copied === 'base' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {isLocalhostWithoutNgrok && (
                <div className="flex gap-3 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-amber-200 font-medium">
                      ngrok চালু নেই — ওয়েবহুক কাজ করবে না
                    </p>
                    <p className="text-xs text-amber-200/90">
                      টার্মিনালে ngrok চালু করুন, তারপর পেজ রিফ্রেশ করুন। সার্ভার পোর্ট 5001 হলে:
                    </p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 px-3 py-2 rounded bg-slate-800/80 border border-amber-500/20 text-amber-200 font-mono text-sm">
                        ngrok http 5001
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard('ngrok http 5001', 'ngrok-cmd')}
                        className="shrink-0"
                        title="কপি করুন"
                      >
                        {copied === 'ngrok-cmd' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </GamePanel>

          <GamePanel>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-amber-100">Facebook App-এ বসানোর URL ও Token</h2>
              <p className="text-sm text-amber-200/70 mt-1">
                Facebook Developer Dashboard → আপনার অ্যাপ → Webhooks / Messenger / Facebook Login settings এ নিচের মানগুলো কপি করে বসান।
              </p>
              <div className="flex gap-2 mb-4 border-b border-amber-500/20 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('local')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === 'local' ? 'border-amber-500 text-amber-100' : 'border-transparent text-amber-200/70 hover:text-amber-100'
                  }`}
                >
                  <Wifi className="inline h-4 w-4 mr-1.5" />
                  লোকাল (ngrok)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('production')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === 'production' ? 'border-amber-500 text-amber-100' : 'border-transparent text-amber-200/70 hover:text-amber-100'
                  }`}
                >
                  <Globe className="inline h-4 w-4 mr-1.5" />
                  লাইভ সার্ভার / ডোমেইন
                </button>
              </div>

              {activeTab === 'local' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-amber-200/70">Webhook Callback URL — Webhooks সেকশনে Callback URL ফিল্ডে</Label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={urls.webhookCallbackUrl} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(urls.webhookCallbackUrl, 'webhook')}
                      >
                        {copied === 'webhook' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-amber-200/70">OAuth Redirect URI — Valid OAuth Redirect URIs তে যোগ করুন</Label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={urls.oauthRedirectUri} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(urls.oauthRedirectUri, 'oauth')}
                      >
                        {copied === 'oauth' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-amber-200/70">Verify Token — Webhooks সেকশনে Verify Token ফিল্ডে (একই মান)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={urls.verifyToken} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(urls.verifyToken, 'verify')}
                      >
                        {copied === 'verify' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'production' && (
                <div className="space-y-4">
                  <p className="text-sm text-amber-200/80">
                    লাইভ সার্ভার বা cPanel এ deploy করলে নিচের ফিল্ডে আপনার API Base URL দিন (যেমন <code className="bg-amber-500/20 px-1 rounded border border-amber-500/30">https://api.yourdomain.com</code>)। ফেসবুক অ্যাপে কোন লিংক দিতে হবে সেটা দেখাবে।
                  </p>
                  <div>
                    <Label htmlFor="prodDomain" className="text-amber-200/90">আপনার ডোমেইন / Base URL</Label>
                    <Input id="prodDomain" value={productionDomain} onChange={(e) => setProductionDomain(e.target.value)} placeholder="https://api.yourdomain.com" className="mt-1 font-mono bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50" />
                  </div>
                  {prodUrls && (
                    <div className="space-y-3 pt-2 border-t border-amber-500/20">
                      <div>
                        <Label className="text-xs text-amber-200/70">App Domains এ বসান — Basic Settings</Label>
                        <div className="flex gap-2 mt-1">
                          <Input readOnly value={prodUrls.appDomain} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                          <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(prodUrls.appDomain, 'prod-domain')}>
                            {copied === 'prod-domain' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-amber-200/70">Webhook Callback URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input readOnly value={prodUrls.webhookCallbackUrl} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                          <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(prodUrls.webhookCallbackUrl, 'prod-webhook')}>
                            {copied === 'prod-webhook' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-amber-200/70">OAuth Redirect URI</Label>
                        <div className="flex gap-2 mt-1">
                          <Input readOnly value={prodUrls.oauthRedirectUri} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                          <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(prodUrls.oauthRedirectUri, 'prod-oauth')}>
                            {copied === 'prod-oauth' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-amber-200/70">Verify Token</Label>
                        <div className="flex gap-2 mt-1">
                          <Input readOnly value={prodUrls.verifyToken} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                          <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(prodUrls.verifyToken, 'prod-verify')}>
                            {copied === 'prod-verify' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GamePanel>
        </>
      )}

      <GamePanel>
        <div className="p-6 border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-200">
            After saving, go to <strong className="text-amber-100">Integrations</strong> and click &quot;ফেসবুক কানেক্ট করুন&quot; to connect your
            Facebook Pages. Messages will appear in Inbox with the Page name.
          </p>
        </div>
      </GamePanel>
    </div>
  );
}
