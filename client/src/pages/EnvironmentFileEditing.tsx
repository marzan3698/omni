import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GamePanel } from '@/components/GamePanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { environmentApi, type FacebookConfig, type WebhookUrls } from '@/lib/environment';
import {
  FileCode,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  Server,
  FileText,
  PlayCircle,
  ExternalLink,
  Youtube,
  Image as ImageIcon,
  BookOpen,
  Lock,
  Globe,
  Settings,
  Key,
  Webhook,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const facebookConfigSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, 'Facebook App ID is required').regex(/^\d+$/, 'Must be numeric'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'Facebook App Secret is required'),
  FACEBOOK_VERIFY_TOKEN: z.string().min(1, 'Facebook Verify Token is required'),
  FACEBOOK_OAUTH_REDIRECT_URI: z.string().url('Invalid URL format'),
});

type FacebookConfigFormData = z.infer<typeof facebookConfigSchema>;

function CopyableField({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-amber-200/90">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
        <Button type="button" variant="outline" size="icon" onClick={onCopy} title="Copy" className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20">
          {copied ? <Check className="h-4 w-4 text-amber-400" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function EnvironmentFileEditing() {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch current configuration
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['facebook-config'],
    queryFn: () => environmentApi.getFacebookConfig(),
  });

  // Fetch webhook URLs (domain-agnostic; works for any deployed domain)
  const { data: webhookUrls, isLoading: urlsLoading } = useQuery({
    queryKey: ['webhook-urls'],
    queryFn: () => environmentApi.getWebhookUrls(),
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FacebookConfigFormData>({
    resolver: zodResolver(facebookConfigSchema),
    defaultValues: {
      FACEBOOK_APP_ID: '',
      FACEBOOK_APP_SECRET: '',
      FACEBOOK_VERIFY_TOKEN: '',
      FACEBOOK_OAUTH_REDIRECT_URI: '',
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      reset({
        FACEBOOK_APP_ID: config.FACEBOOK_APP_ID || '',
        FACEBOOK_APP_SECRET: config.FACEBOOK_APP_SECRET || '',
        FACEBOOK_VERIFY_TOKEN: config.FACEBOOK_VERIFY_TOKEN || '',
        FACEBOOK_OAUTH_REDIRECT_URI: config.FACEBOOK_OAUTH_REDIRECT_URI || '',
      });
    }
  }, [config, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FacebookConfig) => environmentApi.updateFacebookConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-config'] });
      alert('Facebook webhook configuration updated successfully!');
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update configuration');
    },
  });

  const onSubmit = (data: FacebookConfigFormData) => {
    updateMutation.mutate(data);
  };

  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50';
  const labelDark = 'text-amber-200/90';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
          <FileCode className="h-8 w-8 text-amber-400" />
          Environment File Editing
        </h1>
        <p className="text-amber-200/80 mt-1">Manage Facebook webhook configuration from admin panel</p>
      </div>

      {/* Facebook Webhook Configuration Form */}
      <GamePanel>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/20">
              <FileCode className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-amber-100">Facebook Webhook Configuration</h2>
              <p className="text-sm text-amber-200/70 mt-0.5">Edit Facebook integration settings directly from the admin panel</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              <span className="ml-2 text-amber-200/80">Loading configuration...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error loading configuration</span>
              </div>
              <p className="text-sm text-red-200/90 mt-2">
                {(error as Error).message || 'Failed to load Facebook configuration'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Facebook App ID */}
              <div>
                <Label htmlFor="FACEBOOK_APP_ID" className={`text-sm font-medium ${labelDark}`}>
                  Facebook App ID *
                </Label>
                <Input
                  id="FACEBOOK_APP_ID"
                  type="text"
                  placeholder="e.g., 1362036352081793"
                  {...register('FACEBOOK_APP_ID')}
                  className={cn('mt-1', inputDark, errors.FACEBOOK_APP_ID && 'border-red-500')}
                />
                {errors.FACEBOOK_APP_ID && (
                  <p className="text-sm text-red-500 mt-1">{errors.FACEBOOK_APP_ID.message}</p>
                )}
                <p className="text-xs text-amber-200/60 mt-1">
                  Your Facebook App ID from Facebook Developer Dashboard
                </p>
              </div>

              {/* Facebook App Secret */}
              <div>
                <Label htmlFor="FACEBOOK_APP_SECRET" className={`text-sm font-medium ${labelDark}`}>
                  Facebook App Secret *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="FACEBOOK_APP_SECRET"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="Enter your Facebook App Secret"
                    {...register('FACEBOOK_APP_SECRET')}
                    className={cn('pr-10', inputDark, errors.FACEBOOK_APP_SECRET && 'border-red-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/70 hover:text-amber-100"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.FACEBOOK_APP_SECRET && (
                  <p className="text-sm text-red-500 mt-1">{errors.FACEBOOK_APP_SECRET.message}</p>
                )}
                <p className="text-xs text-amber-200/60 mt-1">
                  Your Facebook App Secret from Facebook Developer Dashboard
                </p>
              </div>

              {/* Facebook Verify Token */}
              <div>
                <Label htmlFor="FACEBOOK_VERIFY_TOKEN" className={`text-sm font-medium ${labelDark}`}>
                  Facebook Verify Token *
                </Label>
                <Input
                  id="FACEBOOK_VERIFY_TOKEN"
                  type="text"
                  placeholder="e.g., omni_crm_webhook_2024_secure"
                  {...register('FACEBOOK_VERIFY_TOKEN')}
                  className={cn('mt-1', inputDark, errors.FACEBOOK_VERIFY_TOKEN && 'border-red-500')}
                />
                {errors.FACEBOOK_VERIFY_TOKEN && (
                  <p className="text-sm text-red-500 mt-1">{errors.FACEBOOK_VERIFY_TOKEN.message}</p>
                )}
                <p className="text-xs text-amber-200/60 mt-1">
                  Secret token for webhook verification (must match Facebook App settings)
                </p>
              </div>

              {/* Facebook OAuth Redirect URI */}
              <div>
                <Label htmlFor="FACEBOOK_OAUTH_REDIRECT_URI" className={`text-sm font-medium ${labelDark}`}>
                  Facebook OAuth Redirect URI *
                </Label>
                <Input
                  id="FACEBOOK_OAUTH_REDIRECT_URI"
                  type="text"
                  placeholder="http://localhost:5001/api/integrations/facebook/callback"
                  {...register('FACEBOOK_OAUTH_REDIRECT_URI')}
                  className={cn('mt-1', inputDark, errors.FACEBOOK_OAUTH_REDIRECT_URI && 'border-red-500')}
                />
                {errors.FACEBOOK_OAUTH_REDIRECT_URI && (
                  <p className="text-sm text-red-500 mt-1">{errors.FACEBOOK_OAUTH_REDIRECT_URI.message}</p>
                )}
                <p className="text-xs text-amber-200/60 mt-1">
                  OAuth callback URL (local: http://localhost:5001/api/integrations/facebook/callback)
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-amber-500/20">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </GamePanel>

      {/* Required URLs */}
      <GamePanel>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/20">
              <LinkIcon className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-amber-100">প্রয়োজনীয় URL (Required URLs for Facebook)</h2>
              <p className="text-sm text-amber-200/70 mt-0.5">
                Facebook App (Messenger API Settings) এ এই URL ও Verify Token কপি করে দিন। ডিপ্লয় করা ডোমেইন অনুযায়ী অটো আপডেট হয়। Production এ সার্ভার env এ API_URL বা PUBLIC_URL সেট করুন。
              </p>
            </div>
          </div>
          {urlsLoading || !webhookUrls ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <span className="ml-2 text-amber-200/80">Loading URLs...</span>
            </div>
          ) : (
              <div className="space-y-4">
              <p className="text-sm text-amber-200/80 mb-4">
                নিচের প্রতিটি মান কপি করে Facebook Developer Console → আপনার অ্যাপ → Use cases → Messenger → Configure webhooks এ যথাক্রমে ব্যবহার করুন।
              </p>
              <CopyableField
                label="1. Callback URL (Facebook Webhook এ দেবেন)"
                value={webhookUrls.webhookCallbackUrl}
                onCopy={() => copyToClipboard(webhookUrls.webhookCallbackUrl, 'callback')}
                copied={copiedField === 'callback'}
              />

              {/* Verify Token with warning if empty */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-amber-200/90">
                  2. Verify token (Facebook Verify token ফিল্ডে দেবেন)
                </Label>
                {webhookUrls.verifyToken ? (
                  <div className="flex gap-2">
                    <Input readOnly value={webhookUrls.verifyToken} className="font-mono text-sm bg-slate-800/60 border-amber-500/20 text-amber-100" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrls.verifyToken, 'verify')}
                      title="Copy"
                    >
                      {copiedField === 'verify' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <div className="flex items-center gap-2 text-red-300 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Verify Token খালি!</span>
                    </div>
                    <p className="text-sm text-red-600 mb-3">
                      সার্ভারে <code className="bg-red-100 px-1 rounded">FACEBOOK_VERIFY_TOKEN</code> সেট করা নেই বা পড়া যাচ্ছে না।
                    </p>
                    <div className="text-xs text-red-700 space-y-1 bg-red-100 p-3 rounded">
                      <p className="font-semibold">Debug Info:</p>
                      {webhookUrls._debug ? (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Config Source: <code>{webhookUrls._debug.configSource}</code></li>
                          <li>Is cPanel: <code>{webhookUrls._debug.isCPanel ? 'Yes' : 'No'}</code></li>
                          <li>Verify Token in config: <code>{webhookUrls._debug.verifyTokenSet ? 'Yes' : 'No'}</code></li>
                          <li>process.env.FACEBOOK_VERIFY_TOKEN: <code>{webhookUrls._debug.processEnvVerifyTokenSet ? 'Set' : 'Not Set'}</code></li>
                          <li>Base URL from: <code>{webhookUrls._debug.baseUrlSource}</code></li>
                        </ul>
                      ) : (
                        <p>No debug info available</p>
                      )}
                    </div>
                    <p className="text-sm text-red-600 mt-3">
                      <strong>সমাধান:</strong> cPanel → Node.js Selector → আপনার অ্যাপ → Environment variables এ <code>FACEBOOK_VERIFY_TOKEN</code> যোগ করুন (যেমন: <code>omni_crm_webhook_2024_secure</code>)। তারপর অ্যাপ Stop → Start করুন।
                    </p>
                  </div>
                )}
              </div>

              <CopyableField
                label="3. OAuth Redirect URI (প্রয়োজনে Facebook OAuth settings এ)"
                value={webhookUrls.oauthRedirectUri}
                onCopy={() => copyToClipboard(webhookUrls.oauthRedirectUri, 'oauth')}
                copied={copiedField === 'oauth'}
              />
              <CopyableField
                label="Base URL (সার্ভার পাবলিক ঠিকানা)"
                value={webhookUrls.baseUrl}
                onCopy={() => copyToClipboard(webhookUrls.baseUrl, 'base')}
                copied={copiedField === 'base'}
              />
            </div>
          )}
        </div>
      </GamePanel>

      {/* Bangla Documentation */}
      <GamePanel>
        <div className="p-6 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/20">
                <FileText className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-100">📖 Environment File Management Guide (বাংলা)</h2>
                <p className="text-sm text-amber-200/70 mt-0.5">Facebook Webhook Configuration পরিচালনার সম্পূর্ণ নির্দেশিকা</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowDocs(!showDocs)} className="text-amber-100 hover:bg-amber-500/20">
              {showDocs ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>

        {showDocs && (
          <div className="p-6 space-y-6">
            {/* Introduction */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                পরিচিতি
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong>Environment File Editing</strong> হল একটি সুবিধা যার মাধ্যমে SuperAdmin সরাসরি admin panel থেকে Facebook webhook configuration edit করতে পারবেন, .env file manually edit না করেই।
                </p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">সহজ Management</p>
                      <p className="text-sm text-gray-600">Admin panel থেকে সরাসরি edit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">Auto Backup</p>
                      <p className="text-sm text-gray-600">Automatic backup before update</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">cPanel Compatible</p>
                      <p className="text-sm text-gray-600">Works on both local and cPanel</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">Safe Updates</p>
                      <p className="text-sm text-gray-600">Validation and error handling</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step-by-Step Facebook Setup Guide */}
            <section>
              <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                      Facebook App Setup - সম্পূর্ণ Step-by-Step Guide
                    </h3>
                    <p className="text-sm text-gray-600">প্রতিটি ধাপে বিস্তারিত নির্দেশনা, ভিডিও টিউটোরিয়াল, স্ক্রিনশট এবং Official Documentation সহ</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-800 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
                    <Youtube className="h-4 w-4" />
                    Video Tutorials Available
                  </span>
                  <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
                    <ImageIcon className="h-4 w-4" />
                    Screenshots & Official Docs
                  </span>
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
                    <ExternalLink className="h-4 w-4" />
                    Direct Links to Resources
                  </span>
                </div>
                {/* Quick Video Links Section */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-red-600" />
                    Quick Video Tutorial Links (প্রতিটি Step-এর জন্য):
                  </p>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    <a href="https://www.youtube.com/results?search_query=facebook+developer+console+complete+tutorial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium p-2 hover:bg-blue-50 rounded">
                      <Youtube className="h-4 w-4" /> Facebook Developer Console
                    </a>
                    <a href="https://www.youtube.com/results?search_query=facebook+messenger+api+setup+tutorial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium p-2 hover:bg-blue-50 rounded">
                      <Youtube className="h-4 w-4" /> Messenger API Setup
                    </a>
                    <a href="https://www.youtube.com/results?search_query=facebook+webhook+setup+tutorial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium p-2 hover:bg-blue-50 rounded">
                      <Youtube className="h-4 w-4" /> Webhook Configuration
                    </a>
                    <a href="https://www.youtube.com/results?search_query=facebook+oauth+setup+tutorial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium p-2 hover:bg-blue-50 rounded">
                      <Youtube className="h-4 w-4" /> OAuth Setup
                    </a>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
                {/* Step 1: Login to Facebook */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <p className="font-bold text-gray-800 text-lg">Facebook-এ Login করুন</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm space-y-3">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">১.১</span>
                            <p>আপনার web browser-এ <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono text-xs">facebook.com</code> এ যান</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">১.২</span>
                            <p>আপনার Facebook account-এ login করুন (email/phone এবং password দিয়ে)</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">১.৩</span>
                            <p>Login successful হলে Facebook homepage-এ redirect হবে</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Note:</strong> যদি Facebook account না থাকে, তাহলে প্রথমে account তৈরি করুন</span>
                          </p>
                        </div>
                        {/* YouTube Video Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            <p className="font-semibold text-red-800 text-sm">📹 Video Tutorial:</p>
                          </div>
                          <p className="text-xs text-red-700 mb-2">Facebook-এ Login করার জন্য এই ভিডিও দেখুন:</p>
                          <a 
                            href="https://www.youtube.com/results?search_query=how+to+login+facebook+account" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-red-700 hover:text-red-800 font-medium"
                          >
                            <PlayCircle className="h-4 w-4" />
                            YouTube: "How to Login Facebook Account"
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Go to Developer Console */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="h-5 w-5 text-indigo-600" />
                        <p className="font-bold text-gray-800 text-lg">Facebook Developer Console-এ যান</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-indigo-100 shadow-sm space-y-3">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-indigo-600">২.১</span>
                            <p>Browser-এ এই URL-এ যান: <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono text-xs">https://developers.facebook.com</code></p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-indigo-600">২.২</span>
                            <div>
                              <p className="mb-1">যদি প্রথমবার Developer Console ব্যবহার করেন, তাহলে:</p>
                              <ul className="ml-4 list-disc space-y-1 text-xs">
                                <li>Facebook Developer account তৈরি করতে হবে (ফ্রি)</li>
                                <li>"Get Started" বা "Continue" button click করুন</li>
                                <li>Phone number verification করতে হতে পারে</li>
                                <li>Developer account terms accept করুন</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-indigo-600">২.৩</span>
                            <p>Developer Console dashboard-এ যাবেন</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <p className="text-xs text-indigo-700 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Note:</strong> Developer account সম্পূর্ণ ফ্রি এবং কোনো payment প্রয়োজন নেই</span>
                          </p>
                        </div>
                        {/* YouTube Video Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            <p className="font-semibold text-red-800 text-sm">📹 Video Tutorial:</p>
                          </div>
                          <p className="text-xs text-red-700 mb-2">Facebook Developer Console setup করার জন্য এই ভিডিওগুলো দেখুন:</p>
                          <div className="space-y-1">
                            <a 
                              href="https://www.youtube.com/results?search_query=facebook+developer+console+setup+tutorial" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-xs text-red-700 hover:text-red-800 font-medium"
                            >
                              <PlayCircle className="h-4 w-4 inline mr-1" />
                              "Facebook Developer Console Setup Tutorial"
                              <ExternalLink className="h-3 w-3 inline ml-1" />
                            </a>
                            <a 
                              href="https://www.youtube.com/results?search_query=how+to+create+facebook+developer+account" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-xs text-red-700 hover:text-red-800 font-medium"
                            >
                              <PlayCircle className="h-4 w-4 inline mr-1" />
                              "How to Create Facebook Developer Account"
                              <ExternalLink className="h-3 w-3 inline ml-1" />
                            </a>
                          </div>
                        </div>
                        {/* Screenshot Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="h-5 w-5 text-green-600" />
                            <p className="font-semibold text-green-800 text-sm">📸 Screenshot Reference:</p>
                          </div>
                          <p className="text-xs text-green-700 mb-2">Official Facebook Developer Console screenshots দেখতে:</p>
                          <a 
                            href="https://developers.facebook.com/docs/development/create-an-app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-green-700 hover:text-green-800 font-medium"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Facebook Official Documentation
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Create Facebook App */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="h-5 w-5 text-purple-600" />
                        <p className="font-bold text-gray-800 text-lg">নতুন Facebook App তৈরি করুন</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm space-y-3">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.১</span>
                            <p>Developer Console-এর top right corner-এ <strong>"My Apps"</strong> button-এ click করুন</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.২</span>
                            <p>Dropdown menu থেকে <strong>"Create App"</strong> select করুন</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.৩</span>
                            <div>
                              <p className="mb-1">App type select করুন:</p>
                              <ul className="ml-4 list-disc space-y-1 text-xs">
                                <li><strong>"Business"</strong> type select করুন (সবচেয়ে common)</li>
                                <li>অথবা <strong>"Other"</strong> type-ও ব্যবহার করতে পারেন</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.৪</span>
                            <div>
                              <p className="mb-1">App details fill করুন:</p>
                              <ul className="ml-4 list-disc space-y-1 text-xs">
                                <li><strong>App Name:</strong> <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono">Omni CRM Integration</code> (যেকোনো নাম)</li>
                                <li><strong>App Contact Email:</strong> আপনার email address</li>
                                <li><strong>Business Account:</strong> (Optional) আপনার business account select করুন</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.৫</span>
                            <p><strong>"Create App"</strong> button click করুন</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">৩.৬</span>
                            <p>Security check complete করুন (captcha বা verification code)</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-700 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Important:</strong> App তৈরি হওয়ার পর App ID এবং App Secret save করে রাখুন!</span>
                          </p>
                        </div>
                        {/* YouTube Video Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            <p className="font-semibold text-red-800 text-sm">📹 Video Tutorial:</p>
                          </div>
                          <p className="text-xs text-red-700 mb-2">Facebook App তৈরি করার জন্য এই ভিডিওগুলো দেখুন:</p>
                          <div className="space-y-1">
                            <a 
                              href="https://www.youtube.com/results?search_query=how+to+create+facebook+app+developer+console" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-xs text-red-700 hover:text-red-800 font-medium"
                            >
                              <PlayCircle className="h-4 w-4 inline mr-1" />
                              "How to Create Facebook App - Complete Guide"
                              <ExternalLink className="h-3 w-3 inline ml-1" />
                            </a>
                            <a 
                              href="https://www.youtube.com/results?search_query=facebook+app+creation+tutorial+2024" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-xs text-red-700 hover:text-red-800 font-medium"
                            >
                              <PlayCircle className="h-4 w-4 inline mr-1" />
                              "Facebook App Creation Tutorial 2024"
                              <ExternalLink className="h-3 w-3 inline ml-1" />
                            </a>
                          </div>
                        </div>
                        {/* Screenshot Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="h-5 w-5 text-green-600" />
                            <p className="font-semibold text-green-800 text-sm">📸 Official Documentation:</p>
                          </div>
                          <a 
                            href="https://developers.facebook.com/docs/development/create-an-app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-green-700 hover:text-green-800 font-medium"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Facebook: Create an App Guide
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Get App ID and App Secret */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Key className="h-5 w-5 text-orange-600" />
                        <p className="font-bold text-gray-800 text-lg">App ID এবং App Secret সংগ্রহ করুন</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-orange-100 shadow-sm space-y-3">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-600">৪.১</span>
                            <p>App Dashboard-এ আপনি automatically redirect হবেন</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-600">৪.২</span>
                            <p>Dashboard-এর left sidebar-এ <strong>"Settings"</strong> → <strong>"Basic"</strong> menu-তে click করুন</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-600">৪.৩</span>
                            <div>
                              <p className="mb-1">Basic Settings page-এ আপনি দেখবেন:</p>
                              <ul className="ml-4 list-disc space-y-1 text-xs">
                                <li><strong>App ID:</strong> একটি long numeric number (যেমন: <code className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-mono">1362036352081793</code>)</li>
                                <li><strong>App Secret:</strong> একটি hidden value (Show button click করে দেখতে পারবেন)</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-600">৪.৪</span>
                            <div>
                              <p className="mb-1">App Secret দেখতে:</p>
                              <ul className="ml-4 list-disc space-y-1 text-xs">
                                <li><strong>"Show"</strong> button click করুন</li>
                                <li>Password verification করতে হতে পারে</li>
                                <li>App Secret value copy করুন</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-600">৪.৫</span>
                            <p>এই দুটি value copy করে safe রাখুন:</p>
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                          <p className="text-xs font-mono text-gray-800 mb-1">App ID: [আপনার App ID এখানে]</p>
                          <p className="text-xs font-mono text-gray-800">App Secret: [আপনার App Secret এখানে]</p>
                        </div>
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 flex items-start gap-2">
                            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Security:</strong> App Secret কখনো share করবেন না বা public repository-তে commit করবেন না!</span>
                          </p>
                        </div>
                        {/* YouTube Video Suggestion */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            <p className="font-semibold text-red-800 text-sm">📹 Video Tutorial:</p>
                          </div>
                          <p className="text-xs text-red-700 mb-2">Facebook App ID এবং App Secret পাওয়ার জন্য:</p>
                          <a 
                            href="https://www.youtube.com/results?search_query=how+to+get+facebook+app+id+and+app+secret" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-xs text-red-700 hover:text-red-800 font-medium"
                          >
                            <PlayCircle className="h-4 w-4 inline mr-1" />
                            "How to Get Facebook App ID and App Secret"
                            <ExternalLink className="h-3 w-3 inline ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Add Messenger Product */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                      5
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-base mb-2">Messenger Product যোগ করুন</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm text-gray-700">
                        <p><strong>ধাপ ৫.১:</strong> App Dashboard-এ left sidebar-এ <strong>"Add Product"</strong> বা <strong>"+ Add Product"</strong> button দেখবেন</p>
                        <p><strong>ধাপ ৫.২:</strong> Product list থেকে <strong>"Messenger"</strong> খুঁজুন</p>
                        <p><strong>ধাপ ৫.৩:</strong> Messenger-এর পাশে <strong>"Set Up"</strong> button click করুন</p>
                        <p><strong>ধাপ ৫.৪:</strong> Messenger setup page-এ redirect হবে</p>
                        <p><strong>ধাপ ৫.৫:</strong> Messenger page-এ আপনি দেখবেন:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li><strong>Access Tokens</strong> section</li>
                          <li><strong>Webhooks</strong> section</li>
                          <li><strong>App Review</strong> section</li>
                        </ul>
                        <p className="text-xs text-blue-600 mt-2">💡 <strong>Note:</strong> Messenger product enable করার পর আপনি messages receive করতে পারবেন</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 6: Generate Access Token */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                      6
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-base mb-2">Page Access Token Generate করুন</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm text-gray-700">
                        <p><strong>ধাপ ৬.১:</strong> Messenger setup page-এ <strong>"Access Tokens"</strong> section-এ যান</p>
                        <p><strong>ধাপ ৬.২:</strong> <strong>"Add or Remove Pages"</strong> button click করুন</p>
                        <p><strong>ধাপ ৬.৩:</strong> Facebook login prompt আসবে - আপনার Facebook account-এ login করুন</p>
                        <p><strong>ধাপ ৬.৪:</strong> Permission request আসবে - <strong>"Continue"</strong> বা <strong>"Allow"</strong> click করুন</p>
                        <p><strong>ধাপ ৬.৫:</strong> আপনার Facebook Pages list দেখাবে - যে Page-এ Messenger enable করতে চান সেটা select করুন</p>
                        <p><strong>ধাপ ৬.৬:</strong> Page select করার পর, <strong>"Next"</strong> click করুন</p>
                        <p><strong>ধাপ ৬.৭:</strong> Permissions review করুন এবং <strong>"Done"</strong> click করুন</p>
                        <p><strong>ধাপ ৬.৮:</strong> Access Tokens section-এ আপনি Page Access Token দেখতে পাবেন</p>
                        <p><strong>ধাপ ৬.৯:</strong> Token-এর পাশে <strong>"Generate Token"</strong> button click করুন (যদি প্রয়োজন হয়)</p>
                        <p><strong>ধাপ ৬.১০:</strong> Long-lived token generate করতে:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li>Graph API Explorer ব্যবহার করুন: <code className="bg-gray-100 px-2 py-0.5 rounded">https://developers.facebook.com/tools/explorer/</code></li>
                          <li>Your App select করুন</li>
                          <li>Page Access Token select করুন</li>
                          <li>API call করুন: <code className="bg-gray-100 px-2 py-0.5 rounded">GET /me?fields=access_token</code></li>
                        </ul>
                        <p className="text-xs text-yellow-600 mt-2">⚠️ <strong>Important:</strong> Short-lived tokens 1-2 ঘণ্টা valid থাকে। Production-এর জন্য long-lived token ব্যবহার করুন</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 7: Setup Webhook */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                      7
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-base mb-2">Webhook Setup করুন</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm text-gray-700">
                        <p><strong>ধাপ ৭.১:</strong> Messenger setup page-এ <strong>"Webhooks"</strong> section-এ যান</p>
                        <p><strong>ধাপ ৭.২:</strong> <strong>"Add Callback URL"</strong> বা <strong>"Edit"</strong> button click করুন</p>
                        <p><strong>ধাপ ৭.৩:</strong> Webhook details fill করুন:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li><strong>Callback URL:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">https://yourdomain.com/api/webhooks/facebook</code> (production) অথবা <code className="bg-gray-100 px-2 py-0.5 rounded">https://your-ngrok-url.ngrok.io/api/webhooks/facebook</code> (local testing)</li>
                          <li><strong>Verify Token:</strong> একটি random secure string (যেমন: <code className="bg-gray-100 px-2 py-0.5 rounded">omni_crm_webhook_2024_secure</code>)</li>
                        </ul>
                        <p><strong>ধাপ ৭.৪:</strong> <strong>"Verify and Save"</strong> button click করুন</p>
                        <p><strong>ধাপ ৭.৫:</strong> Facebook webhook verify করবে - যদি successful হয়, তাহলে green checkmark দেখবেন</p>
                        <p><strong>ধাপ ৭.৬:</strong> <strong>"Manage Subscriptions"</strong> button click করুন</p>
                        <p><strong>ধাপ ৭.৭:</strong> Webhook events subscribe করুন:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li>✅ <strong>messages</strong> - নতুন messages receive করার জন্য</li>
                          <li>✅ <strong>messaging_postbacks</strong> - Postback events-এর জন্য</li>
                          <li>✅ <strong>messaging_optins</strong> - Opt-in events-এর জন্য</li>
                        </ul>
                        <p><strong>ধাপ ৭.৮:</strong> <strong>"Save"</strong> button click করুন</p>
                        <p className="text-xs text-blue-600 mt-2">💡 <strong>Note:</strong> Verify Token-টি এই form-এ <strong>FACEBOOK_VERIFY_TOKEN</strong> field-এ same value দিতে হবে</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 8: Configure OAuth Redirect URI */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                      8
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-base mb-2">OAuth Redirect URI Setup করুন</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm text-gray-700">
                        <p><strong>ধাপ ৮.১:</strong> App Dashboard-এ left sidebar-এ <strong>"Settings"</strong> → <strong>"Basic"</strong> menu-তে যান</p>
                        <p><strong>ধাপ ৮.২:</strong> Page scroll করে <strong>"Add Platform"</strong> section-এ যান</p>
                        <p><strong>ধাপ ৮.৩:</strong> <strong>"Website"</strong> platform add করুন (যদি না থাকে)</p>
                        <p><strong>ধাপ ৮.৪:</strong> <strong>"Facebook Login"</strong> → <strong>"Settings"</strong> menu-তে যান</p>
                        <p><strong>ধাপ ৮.৫:</strong> <strong>"Valid OAuth Redirect URIs"</strong> section-এ আপনার callback URL add করুন:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li>Local: <code className="bg-gray-100 px-2 py-0.5 rounded">http://localhost:5001/api/integrations/facebook/callback</code></li>
                          <li>Production: <code className="bg-gray-100 px-2 py-0.5 rounded">https://yourdomain.com/api/integrations/facebook/callback</code></li>
                        </ul>
                        <p><strong>ধাপ ৮.৬:</strong> <strong>"Save Changes"</strong> button click করুন</p>
                        <p className="text-xs text-blue-600 mt-2">💡 <strong>Note:</strong> এই URL-টি এই form-এ <strong>FACEBOOK_OAUTH_REDIRECT_URI</strong> field-এ same value দিতে হবে</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 9: Fill Form */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      9
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-base mb-2">এই Form-এ Data Fill করুন</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 text-sm text-gray-700">
                        <p><strong>ধাপ ৯.১:</strong> উপরের steps থেকে collected data-গুলো এই form-এ fill করুন:</p>
                        <ul className="ml-4 list-disc space-y-1 mt-1">
                          <li><strong>Facebook App ID:</strong> Step 4 থেকে পাওয়া App ID (numeric number)</li>
                          <li><strong>Facebook App Secret:</strong> Step 4 থেকে পাওয়া App Secret (hidden value)</li>
                          <li><strong>Facebook Verify Token:</strong> Step 7 থেকে webhook-এ যে token দিয়েছেন (same value)</li>
                          <li><strong>Facebook OAuth Redirect URI:</strong> Step 8 থেকে OAuth callback URL (same value)</li>
                        </ul>
                        <p><strong>ধাপ ৯.২:</strong> সব fields fill করার পর <strong>"Save Configuration"</strong> button click করুন</p>
                        <p><strong>ধাপ ৯.৩:</strong> System automatically validate করবে এবং .env file update করবে</p>
                        <p className="text-xs text-green-600 mt-2">✅ <strong>Success:</strong> Configuration save হলে আপনি success message দেখবেন</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Facebook Policies and Requirements */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Facebook Policies এবং Requirements
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="font-semibold text-red-800 mb-2">📋 Facebook App Review Requirements</p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                      <li><strong>App Review:</strong> Production-এ messages send/receive করার জন্য Facebook App Review submit করতে হবে</li>
                      <li><strong>Privacy Policy:</strong> আপনার website-এ Privacy Policy page থাকতে হবে</li>
                      <li><strong>Terms of Service:</strong> Terms of Service page থাকতে হবে</li>
                      <li><strong>Data Usage:</strong> Facebook-এর Data Use Policy follow করতে হবে</li>
                      <li><strong>User Consent:</strong> Users-এর explicit consent নিতে হবে data collection-এর জন্য</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="font-semibold text-red-800 mb-2">🔒 Security Requirements</p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                      <li><strong>HTTPS Required:</strong> Production-এ webhook URL HTTPS হতে হবে (HTTP allowed শুধুমাত্র localhost-এ)</li>
                      <li><strong>Token Security:</strong> App Secret এবং Access Tokens কখনো public-এ share করবেন না</li>
                      <li><strong>Webhook Verification:</strong> Webhook verify token secure রাখুন এবং regularly change করুন</li>
                      <li><strong>Rate Limiting:</strong> Facebook API rate limits follow করুন (200 requests per hour per user)</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="font-semibold text-red-800 mb-2">📱 Messenger Platform Policies</p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                      <li><strong>24-Hour Window:</strong> User message-এর reply 24 ঘণ্টার মধ্যে দিতে হবে (otherwise template message প্রয়োজন)</li>
                      <li><strong>Spam Prevention:</strong> Spam messages send করা যাবে না - Facebook account ban হতে পারে</li>
                      <li><strong>Content Guidelines:</strong> Facebook Community Standards follow করতে হবে</li>
                      <li><strong>User Blocking:</strong> Users যদি block করে, তাহলে আর message send করা যাবে না</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="font-semibold text-red-800 mb-2">⚖️ Data Protection and Privacy</p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                      <li><strong>GDPR Compliance:</strong> EU users-এর জন্য GDPR rules follow করতে হবে</li>
                      <li><strong>Data Retention:</strong> User data retention policy implement করতে হবে</li>
                      <li><strong>Data Deletion:</strong> Users-এর request-এ data delete করার facility থাকতে হবে</li>
                      <li><strong>Encryption:</strong> Sensitive data encryption করতে হবে</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-yellow-200 bg-yellow-50">
                    <p className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</p>
                    <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
                      <li><strong>Testing Mode:</strong> Development-এ App Testing Mode-এ থাকবে - শুধুমাত্র added test users messages receive করতে পারবে</li>
                      <li><strong>Production Mode:</strong> Production-এ App Review complete করতে হবে</li>
                      <li><strong>Page Subscription:</strong> Webhook-এ Page subscribe করতে হবে messages receive করার জন্য</li>
                      <li><strong>Token Expiration:</strong> Short-lived tokens expire হয় - long-lived tokens ব্যবহার করুন</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-200 bg-blue-50">
                    <p className="font-semibold text-blue-800 mb-2">📚 Useful Resources</p>
                    <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                      <li>Facebook Messenger Platform Docs: <code className="bg-blue-100 px-1 rounded">https://developers.facebook.com/docs/messenger-platform</code></li>
                      <li>Facebook App Review Guide: <code className="bg-blue-100 px-1 rounded">https://developers.facebook.com/docs/app-review</code></li>
                      <li>Facebook Platform Policies: <code className="bg-blue-100 px-1 rounded">https://developers.facebook.com/policy</code></li>
                      <li>Graph API Explorer: <code className="bg-blue-100 px-1 rounded">https://developers.facebook.com/tools/explorer/</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* How to Use - Quick Steps */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Form ব্যবহার করার সহজ Steps
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Form Fields Fill করুন</p>
                      <p className="text-sm text-gray-600 mt-1">
                        উপরের step-by-step guide follow করে Facebook App ID, App Secret, Verify Token, এবং OAuth Redirect URI fill করুন
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="w-8"></div>
                    <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Validation Check</p>
                      <p className="text-sm text-gray-600 mt-1">
                        System automatically validate করবে - App ID numeric হতে হবে, URL valid হতে হবে
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="w-8"></div>
                    <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Save Configuration</p>
                      <p className="text-sm text-gray-600 mt-1">
                        "Save Configuration" button click করুন। System automatically backup create করবে এবং .env file update করবে
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="w-8"></div>
                    <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Configuration Updated!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Changes immediately effective হবে। Server restart করার প্রয়োজন নেই (optional)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* cPanel Setup */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                cPanel Setup
              </h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Auto-Detection</p>
                    <p className="text-sm text-gray-600">
                      System automatically detect করবে .env file কোথায় আছে:
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc space-y-1">
                      <li><code className="bg-purple-100 px-1 rounded">api/.env</code> - cPanel structure (public_html/api/.env)</li>
                      <li><code className="bg-purple-100 px-1 rounded">server/.env</code> - Local development</li>
                      <li><code className="bg-purple-100 px-1 rounded">./.env</code> - Fallback location</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">File Permissions</p>
                    <p className="text-sm text-gray-600">
                      cPanel-এ .env file-এর permission 644 বা 600 হতে হবে write করার জন্য
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Warnings */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                সতর্কতা
              </h3>
              <div className="space-y-3">
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <p className="font-medium text-yellow-800 mb-2">⚠️ Automatic Backup</p>
                  <p className="text-sm text-yellow-700">
                    প্রতিবার update করার আগে system automatically backup create করবে <code className="bg-yellow-100 px-1 rounded">.env.backup.timestamp</code> format-এ
                  </p>
                </div>
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <p className="font-medium text-yellow-800 mb-2">⚠️ Server Restart</p>
                  <p className="text-sm text-yellow-700">
                    Changes immediately effective হবে, কিন্তু যদি problem হয় তাহলে server restart করতে পারেন
                  </p>
                </div>
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <p className="font-medium text-yellow-800 mb-2">⚠️ Only Facebook Config</p>
                  <p className="text-sm text-yellow-700">
                    শুধুমাত্র Facebook webhook configuration edit করা যাবে। অন্য environment variables (JWT_SECRET, DATABASE_URL, etc.) protected থাকবে
                  </p>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                সমস্যা সমাধান
              </h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-2">❓ Environment file not found</p>
                  <p className="text-sm text-gray-600">
                    <strong>সমাধান:</strong> Ensure .env file exists in <code className="bg-gray-100 px-1 rounded">api/</code>, <code className="bg-gray-100 px-1 rounded">server/</code>, or root directory
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-2">❓ Permission denied</p>
                  <p className="text-sm text-gray-600">
                    <strong>সমাধান:</strong> cPanel File Manager-এ .env file-এর permission 644 বা 600 set করুন
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-2">❓ Invalid URL format</p>
                  <p className="text-sm text-gray-600">
                    <strong>সমাধান:</strong> OAuth Redirect URI must be a valid URL (start with http:// or https://)
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-2">❓ App ID must be numeric</p>
                  <p className="text-sm text-gray-600">
                    <strong>সমাধান:</strong> Facebook App ID শুধুমাত্র numbers হতে হবে (no letters or special characters)
                  </p>
                </div>
              </div>
            </section>

            {/* Why This Feature */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                কেন এই Feature প্রয়োজন?
              </h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong>Environment File Editing</strong> feature-এর মাধ্যমে:
                </p>
                <ul className="space-y-2 text-sm text-gray-700 ml-4 list-disc">
                  <li>SSH access ছাড়াই .env file edit করা যায়</li>
                  <li>cPanel File Manager-এ manually edit করার ঝামেলা নেই</li>
                  <li>Automatic backup system-এর মাধ্যমে safe updates</li>
                  <li>Input validation-এর মাধ্যমে errors prevent করা</li>
                  <li>Admin panel থেকে centralized management</li>
                  <li>Changes immediately effective (no server restart needed)</li>
                </ul>
              </div>
            </section>
          </div>
        )}
      </GamePanel>
    </div>
  );
}
