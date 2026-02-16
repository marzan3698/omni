import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, adminApi, productApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Search } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: number;
}

export function InvoiceCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  const { data: clientsResponse } = useQuery({
    queryKey: ['admin-clients-invoice', user?.companyId, clientSearch],
    queryFn: async () => {
      const response = await adminApi.getAllClients({
        companyId: user!.companyId!,
        search: clientSearch || undefined,
      });
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products-invoice', user?.companyId, productSearch],
    queryFn: async () => {
      const response = await productApi.getAll(user!.companyId!, {
        search: productSearch || undefined,
      });
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const clients = clientsResponse || [];
  const products = productsResponse || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => financeApi.invoices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoice');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create invoice');
    },
  });

  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );

  const addProduct = (product: any) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          description: product.name,
          quantity: 1,
          unitPrice: Number(product.salePrice),
          productId: product.id,
        },
      ]);
    }
  };

  const addCustomItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !clientId) {
      alert('Please select a client');
      return;
    }
    if (items.length === 0) {
      alert('Add at least one item');
      return;
    }
    const validItems = items.filter(
      (i) => i.description.trim() && i.quantity > 0 && i.unitPrice >= 0
    );
    if (validItems.length === 0) {
      alert('All items must have description, quantity > 0, and unit price >= 0');
      return;
    }
    createMutation.mutate({
      companyId: user.companyId,
      clientId,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      items: validItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productId: i.productId,
      })),
    });
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-slate-600">Please select a company.</div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_invoices">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Create Invoice</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search client..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8 mb-2"
                  />
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {clients.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClientId(c.id);
                          setClientSearch(c.name);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                          clientId === c.id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        {c.name}
                        {c.contactInfo?.email && (
                          <span className="text-slate-500 text-sm ml-2">
                            ({c.contactInfo.email})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Products</CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {products.slice(0, 12).map((p: any) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addProduct(p)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {p.name} - ৳{Number(p.salePrice).toLocaleString()}
                  </Button>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addCustomItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Item
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="w-24 text-right py-2">Qty</th>
                      <th className="w-32 text-right py-2">Unit Price</th>
                      <th className="w-32 text-right py-2">Total</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(i, 'description', e.target.value)
                            }
                            placeholder="Item description"
                            className="h-8"
                          />
                        </td>
                        <td className="py-2">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                i,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                i,
                                'unitPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="py-2 text-right">
                          ৳
                          {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(i)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right font-semibold">
                Total: ৳{totalAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || !clientId || items.length === 0}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/invoice')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
