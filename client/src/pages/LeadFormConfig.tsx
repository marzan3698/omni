import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadFormConfigApi, employeeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GamePanel } from '@/components/GamePanel';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { FileEdit, Copy, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED_FIELDS = [
  { key: 'customerName', label: 'Name', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'categoryId', label: 'Category', type: 'select' },
  { key: 'interestId', label: 'Interest', type: 'select' },
  { key: 'value', label: 'Est. Value', type: 'number' },
];

export default function LeadFormConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fieldConfig, setFieldConfig] = useState<{ key: string; label: string; required: boolean; order: number; type: string }[]>([]);
  const [designConfig, setDesignConfig] = useState({ title: '', submitButtonText: '', primaryColor: '', successMessage: '' });
  const [attributionUserId, setAttributionUserId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: config, isLoading, isError, error } = useQuery({
    queryKey: ['lead-form-config'],
    queryFn: async () => {
      const res = await leadFormConfigApi.getConfig();
      return res.data.data;
    },
    enabled: true,
  });

  const companyId = user?.companyId || 1;
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-form', companyId],
    queryFn: async () => {
      const res = await employeeApi.getAll(companyId);
      return res.data.data || [];
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (config) {
      const fc = (config.fieldConfig as any)?.fields;
      setFieldConfig(Array.isArray(fc) && fc.length > 0 ? fc : ALLOWED_FIELDS.map((f, i) => ({ ...f, required: f.key === 'customerName', order: i, type: f.type })));
      const dc = config.designConfig as any;
      setDesignConfig({
        title: dc?.title || 'Get in Touch',
        submitButtonText: dc?.submitButtonText || 'Submit',
        primaryColor: dc?.primaryColor || '#4f46e5',
        successMessage: dc?.successMessage || 'Thank you! We will contact you soon.',
      });
      setAttributionUserId(config.attributionUserId || '');
      setIsActive(config.isActive !== false);
    }
  }, [config]);

  const { data: embedRes } = useQuery({
    queryKey: ['lead-form-embed-code', config?.slug],
    queryFn: async () => {
      const res = await leadFormConfigApi.getEmbedCode();
      return res.data.data;
    },
    enabled: !!config?.slug,
  });

  useEffect(() => {
    if (embedRes?.iframe) {
      setEmbedCode(embedRes.iframe);
    } else if (config?.slug && typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setEmbedCode(`<iframe src="${baseUrl}/embed/lead-form/${config.slug}" width="400" height="500" frameborder="0" style="border: none;"></iframe>`);
    }
  }, [embedRes, config?.slug]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => leadFormConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-form-config'] });
      queryClient.invalidateQueries({ queryKey: ['lead-form-embed-code'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      fieldConfig: { fields: fieldConfig },
      designConfig,
      attributionUserId: attributionUserId || null,
      isActive,
    });
  };

  const toggleField = (key: string) => {
    const exists = fieldConfig.some((f) => f.key === key);
    if (exists) {
      setFieldConfig(fieldConfig.filter((f) => f.key !== key));
    } else {
      const def = ALLOWED_FIELDS.find((f) => f.key === key);
      if (def) setFieldConfig([...fieldConfig, { ...def, required: key === 'customerName', order: fieldConfig.length, type: def.type }].sort((a, b) => a.order - b.order));
    }
  };

  const updateFieldLabel = (key: string, label: string) => {
    setFieldConfig(fieldConfig.map((f) => (f.key === key ? { ...f, label } : f)));
  };

  const updateFieldRequired = (key: string, required: boolean) => {
    setFieldConfig(fieldConfig.map((f) => (f.key === key ? { ...f, required } : f)));
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  if (isLoading) return <div className="p-6 animate-pulse text-amber-200/80">Loading...</div>;

  if (isError && error) {
    const errMsg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load config';
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
          <p className="font-medium">Failed to load Lead Form Configuration</p>
          <p className="mt-2 text-sm">{errMsg}</p>
          <p className="mt-2 text-xs text-amber-200/80">
            If the database table lead_form_configs does not exist, run on server: node scripts/migrate-simple.cjs cpanel_lead_form_config_safe.sql
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_lead_config" fallback={<div className="p-6 text-amber-200">You do not have permission to manage lead form configuration.</div>}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <FileEdit className="h-8 w-8 text-amber-400" />
            Lead Form Configuration
          </h1>
          <p className="text-amber-200/80 mt-1">Configure, design, and get embed code for your website lead form</p>
        </div>
      </div>

        <GamePanel>
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-amber-100">Form Fields</h2>
            <p className="text-sm text-amber-200/70">Select which fields to show. Only lead-related fields are allowed.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALLOWED_FIELDS.map((f) => {
                const current = fieldConfig.find((x) => x.key === f.key);
                return (
                  <div key={f.key} className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20">
                    <input type="checkbox" checked={!!current} onChange={() => toggleField(f.key)} className="rounded" />
                    <div className="flex-1">
                      <Input
                        value={current?.label || f.label}
                        onChange={(e) => updateFieldLabel(f.key, e.target.value)}
                        placeholder="Label"
                        className={inputDark}
                        disabled={!current}
                      />
                    </div>
                    {current && (
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={current.required} onChange={(e) => updateFieldRequired(f.key, e.target.checked)} className="rounded" />
                        Required
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </GamePanel>

        <GamePanel>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-amber-100">Design</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-amber-200/80">Form Title</Label>
                <Input value={designConfig.title} onChange={(e) => setDesignConfig({ ...designConfig, title: e.target.value })} className={inputDark} />
              </div>
              <div>
                <Label className="text-amber-200/80">Submit Button Text</Label>
                <Input value={designConfig.submitButtonText} onChange={(e) => setDesignConfig({ ...designConfig, submitButtonText: e.target.value })} className={inputDark} />
              </div>
              <div>
                <Label className="text-amber-200/80">Primary Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={designConfig.primaryColor} onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })} className="h-10 w-14 rounded border border-amber-500/20 cursor-pointer" />
                  <Input value={designConfig.primaryColor} onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })} className={inputDark} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-amber-200/80">Success Message</Label>
                <Input value={designConfig.successMessage} onChange={(e) => setDesignConfig({ ...designConfig, successMessage: e.target.value })} className={inputDark} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="formActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
              <Label htmlFor="formActive">Form is active</Label>
            </div>
            <div>
              <Label className="text-amber-200/80">Lead attribution (who created)</Label>
              <select value={attributionUserId} onChange={(e) => setAttributionUserId(e.target.value)} className={cn(inputDark, 'w-full px-3 py-2 rounded-lg')}>
                <option value="">First user in company</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.user?.id || ''}>
                    {emp.user?.name || emp.user?.email || `Employee ${emp.id}`}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className={btnOutline}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Config'}
            </Button>
          </div>
        </GamePanel>

        <GamePanel>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-100 mb-2">Embed Code</h2>
            <p className="text-sm text-amber-200/70 mb-4">Copy and paste this code on any website to embed the lead form.</p>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-slate-900/80 border border-amber-500/20 text-amber-200 text-sm overflow-x-auto">{embedCode || 'Loading...'}</pre>
              <Button size="sm" onClick={copyEmbedCode} className="absolute top-2 right-2" variant="outline">
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </GamePanel>
    </div>
    </PermissionGuard>
  );
}
