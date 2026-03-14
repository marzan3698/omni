import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Save, Send, Info, UserCheck } from 'lucide-react';
import apiClientInstance from '@/lib/api';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';

export default function SmsSettings() {
    const queryClient = useQueryClient();
    const [token, setToken] = useState('');
    const [registrationWelcomeSms, setRegistrationWelcomeSms] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');

    // Fetch Settings
    const { isLoading } = useQuery({
        queryKey: ['sms-settings'],
        queryFn: async () => {
            const { data } = await apiClientInstance.get('/sms/settings');
            if (data?.data) {
                setToken(data.data.token || '');
                setRegistrationWelcomeSms(data.data.registrationWelcomeSms || '');
            }
            return data.data;
        }
    });

    // Save Settings
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClientInstance.post('/sms/settings', { 
                token, 
                registrationWelcomeSms 
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-settings'] });
            alert('SMS Settings saved successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to save SMS Settings');
        }
    });

    // Test SMS
    const testMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClientInstance.post('/sms/test', {
                to: testPhone,
                message: testMessage
            });
            return data;
        },
        onSuccess: () => {
            alert('Test SMS Sent Successfully!');
            setTestPhone('');
            setTestMessage('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to send test SMS. Run npm logs or double check your token.');
        }
    });

    const primaryColor = '#f59e0b'; // amber-500

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center p-6 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
                        <MessageSquare className="h-8 w-8 text-amber-400" />
                        SMS Settings
                    </h1>
                    <p className="text-amber-200/80 mt-1">Configure GreenWeb SMS gateway and automation templates</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuration Column */}
                <div className="space-y-6">
                    <DashboardWidgetCard index={1}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <SettingsIcon className="w-5 h-5 text-amber-400" />
                                <h2 className="text-xl font-semibold text-amber-100 italic">Gateway Configuration</h2>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="token" className="text-amber-200/90 italic">GreenWeb Access Token</Label>
                                <Input
                                    id="token"
                                    type="password"
                                    placeholder="Enter your token string..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-slate-900/60 border-amber-500/20 text-amber-100 placeholder-slate-500 h-11"
                                />
                                <p className="text-xs text-slate-400">Find this in your bdbulksms.net developer portal.</p>
                            </div>

                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50 shadow-lg shadow-amber-900/20"
                                onClick={() => saveMutation.mutate()}
                                disabled={saveMutation.isPending || isLoading}
                            >
                                {saveMutation.isPending ? (
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
                    </DashboardWidgetCard>

                    <DashboardWidgetCard index={2}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCheck className="w-5 h-5 text-amber-400" />
                                <h2 className="text-xl font-semibold text-amber-100 italic">Welcome SMS Template</h2>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="welcome-msg" className="text-amber-200/90 italic text-sm">Registration Message</Label>
                                <Textarea
                                    id="welcome-msg"
                                    placeholder="Enter welcome message..."
                                    value={registrationWelcomeSms}
                                    onChange={(e) => setRegistrationWelcomeSms(e.target.value)}
                                    rows={5}
                                    className="bg-slate-900/60 border-amber-500/20 text-amber-100 placeholder-slate-500 resize-none leading-relaxed"
                                />
                                <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10 flex gap-2 items-start">
                                    <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div className="text-[11px] text-amber-200/60 space-y-1">
                                        <p className="font-semibold text-amber-300">Available Placeholders:</p>
                                        <div className="flex gap-4">
                                            <span><code className="bg-slate-950 px-1 rounded text-amber-400">{"{{email}}"}</code> - Client Email</span>
                                            <span><code className="bg-slate-950 px-1 rounded text-amber-400">{"{{password}}"}</code> - Generated Password</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DashboardWidgetCard>
                </div>

                {/* Test Column */}
                <div className="space-y-6">
                    <DashboardWidgetCard index={3}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Send className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-xl font-semibold text-amber-100 italic">Test SMS Tool</h2>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="test-phone" className="text-amber-200/90 text-sm">Destination Number</Label>
                                <Input
                                    id="test-phone"
                                    type="tel"
                                    placeholder="+88017XXXXXXXX"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    disabled={testMutation.isPending}
                                    className="bg-slate-900/60 border-amber-500/20 text-amber-100 placeholder-slate-500 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="test-message" className="text-amber-200/90 text-sm">Test Message</Label>
                                <Textarea
                                    id="test-message"
                                    placeholder="Type your test message here..."
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    disabled={testMutation.isPending}
                                    className="bg-slate-900/60 border-amber-500/20 text-amber-100 placeholder-slate-500 resize-none h-32"
                                />
                            </div>

                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-lg shadow-emerald-900/20"
                                onClick={() => testMutation.mutate()}
                                disabled={testMutation.isPending || !testPhone || !testMessage}
                            >
                                {testMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Dispatching...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Fire Test SMS
                                    </>
                                )}
                            </Button>
                        </div>
                    </DashboardWidgetCard>
                </div>
            </div>
        </div>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.17a2 2 0 0 1 1-1.74l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 1 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
