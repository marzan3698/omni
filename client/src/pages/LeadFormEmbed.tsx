import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { leadFormPublicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LeadFormEmbed() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (!slug) {
      setError('Invalid form');
      setLoading(false);
      return;
    }
    leadFormPublicApi
      .getConfig(slug)
      .then((res) => {
        setConfig(res.data.data);
        const initial: Record<string, string | number> = {};
        (res.data.data?.fieldConfig?.fields || []).forEach((f: any) => {
          initial[f.key] = f.type === 'number' ? '' : '';
        });
        setFormData(initial);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Form not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !config) return;
    setSubmitting(true);
    try {
      const payload: any = { customerName: String(formData.customerName || '').trim() };
      if (formData.phone) payload.phone = String(formData.phone);
      if (formData.description) payload.description = String(formData.description);
      if (formData.categoryId) payload.categoryId = parseInt(String(formData.categoryId), 10);
      if (formData.interestId) payload.interestId = parseInt(String(formData.interestId), 10);
      if (formData.value !== '' && formData.value !== undefined) payload.value = parseFloat(String(formData.value)) || undefined;
      await leadFormPublicApi.submit(slug, payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-slate-900/50 p-6">
        <div className="animate-pulse text-amber-200/80">Loading form...</div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-slate-900/50 p-6">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  const design = config?.designConfig || {};
  const fields = config?.fieldConfig?.fields || [];
  const categories = config?.categories || [];
  const interests = config?.interests || [];

  if (submitted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6" style={{ backgroundColor: design.primaryColor ? `${design.primaryColor}15` : '#1e293b' }}>
        <div className="text-center text-slate-800 dark:text-slate-100 text-lg font-medium">{design.successMessage || 'Thank you! We will contact you soon.'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[400px]" style={{ backgroundColor: design.primaryColor ? `${design.primaryColor}08` : '#0f172a' }}>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{design.title || 'Get in Touch'}</h2>
        {fields
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((f: any) => (
            <div key={f.key}>
              <Label className="text-slate-700 dark:text-slate-300">
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              {f.type === 'textarea' ? (
                <textarea
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  required={f.required}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              ) : f.type === 'select' && f.key === 'categoryId' ? (
                <select
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value || undefined })}
                  required={f.required}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : f.type === 'select' && f.key === 'interestId' ? (
                <select
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value || undefined })}
                  required={f.required}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select...</option>
                  {interests.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={formData[f.key] ?? ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: f.type === 'number' ? e.target.valueAsNumber ?? '' : e.target.value })}
                  required={f.required}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={submitting} style={{ backgroundColor: design.primaryColor || '#4f46e5' }} className="w-full text-white border-0">
          {submitting ? 'Submitting...' : design.submitButtonText || 'Submit'}
        </Button>
      </form>
    </div>
  );
}
