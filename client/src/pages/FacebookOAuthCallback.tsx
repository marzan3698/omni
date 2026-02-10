import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { facebookIntegrationApi, type FacebookPageOption } from '@/lib/facebookIntegration';
import { useQueryClient } from '@tanstack/react-query';

export default function FacebookOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'connecting'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pages, setPages] = useState<FacebookPageOption[]>([]);
  const [connectSessionId, setConnectSessionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const error = searchParams.get('error');
    const sessionId = searchParams.get('connectSessionId');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (sessionId) {
      setConnectSessionId(sessionId);
      facebookIntegrationApi.getConnectSessionPages(sessionId)
        .then((res) => {
          const list = res.data?.data ?? [];
          setPages(list);
          setStatus(list.length ? 'success' : 'error');
          if (list.length === 0) setErrorMessage('No Facebook pages found.');
        })
        .catch ((err) => {
          setStatus('error');
          setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to load pages');
        });
    } else {
      setStatus('error');
      setErrorMessage('Missing connect session');
    }
  }, [searchParams]);

  const togglePage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConnectSelected = async () => {
    if (!connectSessionId || selectedIds.size === 0) return;
    try {
      setStatus('connecting');
      const res = await facebookIntegrationApi.connectPages(connectSessionId, Array.from(selectedIds));
      const results = (res.data?.data ?? []) as Array<{
        pageId: string;
        name: string;
        integrationId?: number;
        success: boolean;
        error?: string;
      }>;

      const ok = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      if (ok.length === 0) {
        setStatus('error');
        setErrorMessage(failed[0]?.error || 'Failed to connect pages. Please check Facebook permissions and webhook subscription.');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      alert(
        failed.length > 0
          ? `Connected ${ok.length} page(s). ${failed.length} failed. Open Integrations → Diagnostics to see the exact reason.`
          : `Connected ${ok.length} page(s). You can now receive messages in Inbox.`
      );
      navigate('/integrations', { replace: true });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to connect pages');
    }
  };

  const handleCancel = () => {
    navigate('/integrations', { replace: true });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-600">Loading your Facebook pages...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCancel} className="w-full">
              Go Back to Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Select Facebook Pages
          </CardTitle>
          <CardDescription>
            এক বা একাধিক পেজ সিলেক্ট করে Connect Selected চাপুন। সব মেসেজ ওই পেজের নামসহ ইনবক্সে আসবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No Facebook pages found.</p>
              <Button onClick={handleCancel} variant="outline">
                Go Back
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <label
                  key={page.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(page.id)}
                    onChange={() => togglePage(page.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{page.name}</span>
                    <span className="text-sm text-gray-500 ml-2">ID: {page.id}</span>
                  </div>
                </label>
              ))}
              <div className="pt-4 flex gap-2">
                <Button
                  onClick={handleConnectSelected}
                  disabled={selectedIds.size === 0 || status === 'connecting'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    `Connect Selected (${selectedIds.size})`
                  )}
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
