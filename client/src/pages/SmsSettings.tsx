import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Save, Send } from 'lucide-react';
import apiClientInstance from '@/lib/api';

export default function SmsSettings() {
    const queryClient = useQueryClient();
    const [token, setToken] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');

    // Fetch Settings
    const { isLoading } = useQuery({
        queryKey: ['sms-settings'],
        queryFn: async () => {
            const { data } = await apiClientInstance.get('/sms/settings');
            if (data?.data?.token) {
                setToken(data.data.token);
            }
            return data.data;
        }
    });

    // Save Settings
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClientInstance.post('/sms/settings', { token });
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

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">SMS Settings (GreenWeb)</h1>
                <p className="text-slate-500">Configure your GreenWeb SMS bulk gateway token.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                            API Configuration
                        </CardTitle>
                        <CardDescription>
                            Enter the access token from your bdbulksms.net developer portal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">GreenWeb Access Token</Label>
                            <Input
                                id="token"
                                type="password"
                                placeholder="Enter your token string..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            className="w-full"
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
                                    Save Token
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Test Tool Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-green-500" />
                            Send Test SMS
                        </CardTitle>
                        <CardDescription>
                            Verify your setup by sending a test message.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (with Country Code)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+88017XXXXXXXX"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                disabled={testMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message Body</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter a short test message..."
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                disabled={testMutation.isPending}
                                rows={3}
                            />
                        </div>

                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => testMutation.mutate()}
                            disabled={testMutation.isPending || !testPhone || !testMessage}
                        >
                            {testMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Test Message
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
