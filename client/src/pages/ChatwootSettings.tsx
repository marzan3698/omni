import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Unlink, CheckCircle2, XCircle, Copy, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── API helpers ──────────────────────────────────────────────────────────────

const chatwootApi = {
    getConfig: () => apiClient.get('/chatwoot/config'),
    saveConfig: (data: any) => apiClient.post('/chatwoot/config', data),
    testConnection: (data: any) => apiClient.post('/chatwoot/test', data),
    deleteConfig: () => apiClient.delete('/chatwoot/config'),
};

// ─── Copy helper ──────────────────────────────────────────────────────────────
function CopyField({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="flex items-center gap-2 bg-slate-800 border border-amber-500/20 rounded-lg px-3 py-2 text-sm font-mono text-amber-100 break-all">
            <span className="flex-1 text-xs">{value}</span>
            <button
                onClick={handleCopy}
                className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
                title="Copy"
            >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ChatwootSettings() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        baseUrl: '',
        apiToken: '',
        accountId: '',
        webhookSecret: '',
    });
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
    const [saved, setSaved] = useState(false);

    // Fetch existing config
    const { data: configRes, isLoading } = useQuery({
        queryKey: ['chatwoot-config'],
        queryFn: async () => {
            const res = await chatwootApi.getConfig();
            return res.data?.data as any;
        },
    });

    const isConfigured = (configRes as any)?.configured;

    // Pre-fill form when config loads
    useEffect(() => {
        if ((configRes as any)?.configured) {
            setForm(f => ({
                ...f,
                baseUrl: (configRes as any).baseUrl || '',
                accountId: String((configRes as any).accountId || ''),
            }));
        }
    }, [configRes]);

    // Save config mutation
    const saveMutation = useMutation({
        mutationFn: (data: any) => chatwootApi.saveConfig(data),
        onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            queryClient.invalidateQueries({ queryKey: ['chatwoot-config'] });
        },
    });

    // Test connection mutation
    const testMutation = useMutation({
        mutationFn: (data: any) => chatwootApi.testConnection(data),
        onSuccess: (res: any) => {
            setTestResult({ ok: true, message: res.data?.message || 'Connected!' });
        },
        onError: (err: any) => {
            setTestResult({ ok: false, message: err.response?.data?.message || 'Connection failed' });
        },
    });

    // Delete config mutation
    const deleteMutation = useMutation({
        mutationFn: () => chatwootApi.deleteConfig(),
        onSuccess: () => {
            setForm({ baseUrl: '', apiToken: '', accountId: '', webhookSecret: '' });
            queryClient.invalidateQueries({ queryKey: ['chatwoot-config'] });
        },
    });

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setTestResult(null);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.baseUrl || !form.apiToken || !form.accountId) return;
        saveMutation.mutate(form);
    };

    const handleTest = () => {
        if (!form.baseUrl || !form.apiToken || !form.accountId) return;
        setTestResult(null);
        testMutation.mutate(form);
    };

    // Webhook URL for this company
    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    const webhookUrl = `${apiBase}/api/webhooks/chatwoot?companyId=${user?.companyId}`;

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <GamePanel>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-500/20">
                            <Link2 className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-amber-100">Chatwoot Integration</h1>
                            <p className="text-sm text-amber-200/60">
                                WhatsApp ও Messenger মেসেজ CRM Inbox-এ আনুন
                            </p>
                        </div>
                        {isConfigured && (
                            <span className="ml-auto flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                <CheckCircle2 className="h-3 w-3" /> Connected
                            </span>
                        )}
                    </div>

                    {/* How it works */}
                    <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-400/20 text-sm text-blue-200 space-y-1">
                        <p className="font-medium text-blue-300">কীভাবে কাজ করে:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-blue-200/80">
                            <li>Chatwoot-এ WhatsApp ও Messenger inbox setup করা থাকলে</li>
                            <li>Chatwoot নিচের Webhook URL-এ message পাঠাবে</li>
                            <li>আপনার CRM Inbox-এ WhatsApp/Messenger badge সহ message দেখাবে</li>
                            <li>CRM থেকে reply করলে Chatwoot-এও automatically যাবে</li>
                        </ol>
                    </div>

                    {/* Webhook URL */}
                    <div className="mb-6 space-y-1">
                        <Label className="text-amber-200 text-sm font-medium">
                            📋 Chatwoot-এ এই Webhook URL দিন:
                        </Label>
                        <CopyField value={webhookUrl} />
                        <p className="text-xs text-amber-200/50">
                            Chatwoot → Settings → Integrations → Webhooks → Add Webhook URL
                        </p>
                    </div>

                    <hr className="border-amber-500/20 mb-6" />

                    {/* Config Form */}
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <Label className="text-amber-200 text-sm">Chatwoot URL *</Label>
                            <Input
                                name="baseUrl"
                                value={form.baseUrl}
                                onChange={handleChange}
                                placeholder="https://app.chatwoot.com"
                                className="bg-slate-800 border-amber-500/30 text-amber-100 placeholder:text-amber-200/30 mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-amber-200 text-sm">API Access Token *</Label>
                            <Input
                                name="apiToken"
                                type="password"
                                value={form.apiToken}
                                onChange={handleChange}
                                placeholder="Chatwoot → Profile → Access Token"
                                className="bg-slate-800 border-amber-500/30 text-amber-100 placeholder:text-amber-200/30 mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-amber-200 text-sm">Account ID *</Label>
                            <Input
                                name="accountId"
                                type="number"
                                value={form.accountId}
                                onChange={handleChange}
                                placeholder="1"
                                className="bg-slate-800 border-amber-500/30 text-amber-100 placeholder:text-amber-200/30 mt-1"
                            />
                            <p className="text-xs text-amber-200/50 mt-1">
                                Chatwoot URL-এ দেখুন: /app/accounts/<strong>1</strong>/...
                            </p>
                        </div>

                        <div>
                            <Label className="text-amber-200 text-sm">Webhook Secret (Optional)</Label>
                            <Input
                                name="webhookSecret"
                                type="password"
                                value={form.webhookSecret}
                                onChange={handleChange}
                                placeholder="Optional: HMAC সিকিউরিটির জন্য"
                                className="bg-slate-800 border-amber-500/30 text-amber-100 placeholder:text-amber-200/30 mt-1"
                            />
                        </div>

                        {/* Test result */}
                        {testResult && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.ok
                                ? 'bg-green-400/10 text-green-300 border border-green-400/20'
                                : 'bg-red-400/10 text-red-300 border border-red-400/20'
                                }`}>
                                {testResult.ok
                                    ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    : <XCircle className="h-4 w-4 shrink-0" />
                                }
                                {testResult.message}
                            </div>
                        )}

                        {saved && (
                            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-400/10 text-green-300 border border-green-400/20">
                                <CheckCircle2 className="h-4 w-4" /> Config saved successfully!
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTest}
                                disabled={!form.baseUrl || !form.apiToken || !form.accountId || testMutation.isPending}
                                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                            >
                                {testMutation.isPending
                                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    : <RefreshCw className="h-4 w-4 mr-2" />
                                }
                                Test Connection
                            </Button>

                            <Button
                                type="submit"
                                disabled={!form.baseUrl || !form.apiToken || !form.accountId || saveMutation.isPending}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                            >
                                {saveMutation.isPending
                                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    : <CheckCircle2 className="h-4 w-4 mr-2" />
                                }
                                Save Config
                            </Button>

                            {isConfigured && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm('Chatwoot config সরিয়ে দেবেন?')) deleteMutation.mutate();
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="ml-auto"
                                >
                                    <Unlink className="h-4 w-4 mr-2" /> Disconnect
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </GamePanel>

            {/* Setup guide */}
            <GamePanel>
                <div className="p-6 space-y-3 text-sm">
                    <h2 className="font-semibold text-amber-200">⚙️ Chatwoot Setup Guide</h2>
                    <ol className="list-decimal list-inside space-y-2 text-amber-200/70">
                        <li>Chatwoot account তৈরি করুন: <a href="https://app.chatwoot.com" target="_blank" rel="noopener" className="text-blue-400 underline">app.chatwoot.com</a></li>
                        <li>WhatsApp inbox: Settings → Inboxes → Add Inbox → WhatsApp (Twilio/360dialog)</li>
                        <li>Messenger inbox: Settings → Inboxes → Add Inbox → Facebook</li>
                        <li>Webhook: Settings → Integrations → Webhooks → উপরের URL paste করুন</li>
                        <li>Webhook events চেক করুন: <strong>message_created</strong>, <strong>conversation_created</strong></li>
                        <li>API Token: Profile → Access Token</li>
                    </ol>
                </div>
            </GamePanel>
        </div>
    );
}

export default ChatwootSettings;
