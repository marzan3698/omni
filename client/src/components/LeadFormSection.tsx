import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadFormPublicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LeadFormSectionProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export function LeadFormSection({ primaryColor = '#4f46e5', secondaryColor = '#7c3aed' }: LeadFormSectionProps) {
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: configRes, isLoading } = useQuery({
    queryKey: ['lead-form-default'],
    queryFn: () => leadFormPublicApi.getDefaultConfig(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const config = configRes?.data?.data;
  const slug = config?.slug;

  useEffect(() => {
    if (config?.fieldConfig?.fields) {
      const initial: Record<string, string | number> = {};
      config.fieldConfig.fields.forEach((f: { key: string; type?: string }) => {
        initial[f.key] = f.type === 'number' ? '' : '';
      });
      setFormData(initial);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !config) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, string | number | undefined> = {
        customerName: String(formData.customerName || '').trim(),
      };
      if (formData.phone) payload.phone = String(formData.phone);
      if (formData.description) payload.description = String(formData.description);
      if (formData.categoryId) payload.categoryId = parseInt(String(formData.categoryId), 10) || undefined;
      if (formData.interestId) payload.interestId = parseInt(String(formData.interestId), 10) || undefined;
      if (formData.value !== '' && formData.value !== undefined) payload.value = parseFloat(String(formData.value)) || undefined;
      await leadFormPublicApi.submit(slug, payload as any);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !config) return null;

  const design = config.designConfig || {};
  const fields = config.fieldConfig?.fields || [];
  const categories = config.categories || [];
  const interests = config.interests || [];

  if (submitted) {
    return (
      <section className="py-20" style={{ background: `linear-gradient(to bottom right, ${primaryColor}15, ${secondaryColor}15)` }}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-xl mx-auto py-12 px-6 rounded-2xl bg-white shadow-lg">
            <p className="text-xl font-medium text-slate-800">{design.successMessage || 'Thank you! We will contact you soon.'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" style={{ background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10)` }}>
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{design.title || 'Get in Touch'}</h2>
            <p className="text-slate-600">Submit your enquiry and we&apos;ll get back to you shortly.</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
            {fields
              .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
              .map((f: { key: string; label: string; required?: boolean; type?: string }) => (
                <div key={f.key}>
                  <Label className="text-slate-700">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      required={f.required}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  ) : f.type === 'select' && f.key === 'categoryId' ? (
                    <select
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value || undefined })}
                      required={f.required}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="">Select...</option>
                      {categories.map((c: { id: number; name: string }) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : f.type === 'select' && f.key === 'interestId' ? (
                    <select
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value || undefined })}
                      required={f.required}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="">Select...</option>
                      {interests.map((i: { id: number; name: string }) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={formData[f.key] ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [f.key]: f.type === 'number' ? (e.target.valueAsNumber ?? '') : e.target.value,
                        })
                      }
                      required={f.required}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 text-white border-0"
              style={{ backgroundColor: design.primaryColor || primaryColor }}
            >
              {submitting ? 'Submitting...' : design.submitButtonText || 'Submit'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
