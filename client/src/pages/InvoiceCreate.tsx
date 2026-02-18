import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, adminApi, productApi, serviceApi, paymentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/PermissionGuard';
import { GamePanel } from '@/components/GamePanel';
import { FileText } from 'lucide-react';
import { InvoiceClientSelector } from '@/components/invoice/InvoiceClientSelector';
import { InvoiceItemPicker } from '@/components/invoice/InvoiceItemPicker';
import {
  InvoiceLineItemsTable,
  type LineItem,
} from '@/components/invoice/InvoiceLineItemsTable';
import {
  InvoicePaymentSection,
  type PaymentRow,
} from '@/components/invoice/InvoicePaymentSection';
import { InvoiceSummaryBar } from '@/components/invoice/InvoiceSummaryBar';

const btnOutline =
  'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

export function InvoiceCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
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
  const [payments, setPayments] = useState<PaymentRow[]>([]);

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

  const { data: servicesResponse } = useQuery({
    queryKey: ['services-invoice', user?.companyId],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const clients = clientsResponse || [];
  const products = productsResponse || [];
  const allServices = servicesResponse || [];
  const services = serviceSearch.trim()
    ? allServices.filter((s: { title?: string }) =>
        (s.title || '').toLowerCase().includes(serviceSearch.toLowerCase())
      )
    : allServices;

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      financeApi.invoices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoice');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      alert(err.response?.data?.message || 'Failed to create invoice');
    },
  });

  const addProduct = (p: { id: number; name: string; salePrice: number }) => {
    const existing = items.find((i) => i.productId === p.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          description: p.name,
          quantity: 1,
          unitPrice: p.salePrice,
          productId: p.id,
        },
      ]);
    }
  };

  const addService = (s: {
    id: number;
    title: string;
    pricing: number;
  }) => {
    setItems([
      ...items,
      {
        description: s.title,
        quantity: 1,
        unitPrice: s.pricing,
        serviceId: s.id,
      },
    ]);
  };

  const addCustomItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (
    index: number,
    field: keyof LineItem,
    value: number | string
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  const validPayments = payments.filter(
    (p) =>
      p.paymentGatewayId > 0 &&
      p.amount > 0 &&
      (p.transactionId || '').trim().length > 0
  );
  const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (validPayments.length > 0 && totalPaid > totalAmount) {
      alert('Total paid cannot exceed total amount');
      return;
    }

    try {
      const response = await createMutation.mutateAsync({
        companyId: user.companyId,
        clientId,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        items: validItems.map((i) => {
          const item: Record<string, unknown> = {
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          };
          if (i.productId != null && i.productId > 0) item.productId = i.productId;
          if (i.serviceId != null && i.serviceId > 0) item.serviceId = i.serviceId;
          return item;
        }),
      });
      const invoice = response?.data?.data;
      if (invoice?.id && validPayments.length > 0) {
        for (const p of validPayments) {
          await paymentApi.create({
            invoiceId: invoice.id,
            paymentGatewayId: p.paymentGatewayId,
            amount: p.amount,
            transactionId: p.transactionId.trim(),
            paidBy: p.paidBy?.trim() || undefined,
            notes: p.notes?.trim() || undefined,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      navigate('/invoice');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-amber-200/80">Please select a company.</div>
    );
  }

  const due = totalAmount - totalPaid;

  return (
    <PermissionGuard permission="can_manage_invoices">
      <div className="p-4 lg:p-6 flex flex-col min-h-[calc(100vh-8rem)]">
        <div className="flex-shrink-0 mb-4">
          <GamePanel className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
                  <FileText className="h-7 w-7 text-amber-400" />
                  Create Invoice
                </h1>
                <p className="text-amber-200/80 text-sm mt-0.5">
                  Advanced POS – Select customer, add items, complete payment
                </p>
              </div>
              <InvoiceClientSelector
                clientId={clientId}
                clientSearch={clientSearch}
                onClientSearchChange={setClientSearch}
                onClientSelect={(c) => setClientId(c.id)}
                clients={clients}
                compact
              />
            </div>
          </GamePanel>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(280px,380px)_1fr] gap-4 min-h-0">
            {/* Left: Products & Services */}
            <div className="lg:h-[calc(100vh-18rem)] min-h-[320px] flex flex-col">
              <InvoiceItemPicker
                products={products}
                services={services}
                productSearch={productSearch}
                serviceSearch={serviceSearch}
                onProductSearchChange={setProductSearch}
                onServiceSearchChange={setServiceSearch}
                onAddProduct={addProduct}
                onAddService={addService}
                onAddCustom={addCustomItem}
                sidebar
              />
            </div>

            {/* Right: Line items, Details, Payment, Summary */}
            <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
              <InvoiceLineItemsTable
                items={items}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
              <InvoicePaymentSection
                totalAmount={totalAmount}
                payments={payments}
                onPaymentsChange={setPayments}
              />
              <InvoiceSummaryBar
                totalAmount={totalAmount}
                totalPaid={totalPaid}
                due={due}
                issueDate={issueDate}
                dueDate={dueDate}
                notes={notes}
                onIssueDateChange={setIssueDate}
                onDueDateChange={setDueDate}
                onNotesChange={setNotes}
              />
            </div>
          </div>

          <div className="flex-shrink-0 flex gap-2 pt-4 border-t border-amber-500/20 mt-4">
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                !clientId ||
                items.length === 0 ||
                totalPaid > totalAmount
              }
              className="bg-amber-600 hover:bg-amber-500 text-slate-900 font-semibold"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/invoice')}
              className={btnOutline}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
