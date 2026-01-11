import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { financeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Receipt, TrendingUp, TrendingDown } from 'lucide-react';

export function Finance() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.companyId) {
      loadSummary();
    }
  }, [user]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await financeApi.summary(user!.companyId!);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Finance</h1>
        <p className="text-slate-600 mt-1">Financial overview and management</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-2xl font-bold text-slate-900">
                  ৳{summary.income?.toLocaleString() || '0'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div className="text-2xl font-bold text-slate-900">
                  ৳{summary.expenses?.toLocaleString() || '0'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <div className={`text-2xl font-bold ${
                  (summary.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ৳{summary.profit?.toLocaleString() || '0'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Receipt className="w-4 h-4 mr-2" />
              Manage Invoices
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <DollarSign className="w-4 h-4 mr-2" />
              View Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

