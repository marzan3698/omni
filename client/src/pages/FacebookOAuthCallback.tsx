import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { facebookOAuthApi, type FacebookPage } from '@/lib/facebookOAuth';
import { useQueryClient } from '@tanstack/react-query';

export default function FacebookOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [tokenData, setTokenData] = useState<{ userAccessToken: string; companyId: number } | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const pagesParam = searchParams.get('pages');
    const tokenParam = searchParams.get('token');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (pagesParam && tokenParam) {
      try {
        const parsedPages = JSON.parse(decodeURIComponent(pagesParam)) as FacebookPage[];
        const parsedToken = JSON.parse(decodeURIComponent(tokenParam)) as {
          userAccessToken: string;
          companyId: number;
        };

        setPages(parsedPages);
        setTokenData(parsedToken);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to parse OAuth response');
      }
    } else {
      setStatus('error');
      setErrorMessage('Missing OAuth response data');
    }
  }, [searchParams]);

  const handleSelectPage = async (page: FacebookPage) => {
    if (!tokenData) return;

    try {
      setStatus('loading');
      await facebookOAuthApi.connectPage(page.id, page.name, page.access_token);

      // Invalidate integrations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['integrations'] });

      // Redirect to integrations page
      navigate('/integrations', { replace: true });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to connect page');
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
              <p className="text-sm text-gray-600">Processing OAuth callback...</p>
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
              OAuth Error
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
            Select Facebook Page
          </CardTitle>
          <CardDescription>
            Choose which Facebook page you want to connect to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No Facebook pages found.</p>
              <p className="text-sm text-gray-500 mb-4">
                Make sure you have at least one Facebook page and that you granted the necessary permissions.
              </p>
              <Button onClick={handleCancel} variant="outline">
                Go Back
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{page.name}</h3>
                    <p className="text-sm text-gray-500">Page ID: {page.id}</p>
                  </div>
                  <Button
                    onClick={() => handleSelectPage(page)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Connect
                  </Button>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Button onClick={handleCancel} variant="outline" className="w-full">
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
