import { useQuery } from '@tanstack/react-query';
import { PublicHeader } from '@/components/PublicHeader';
import { themeApi } from '@/lib/api';

export default function Contact() {
  // Fetch theme settings for contact information
  const { data: themeSettings } = useQuery({
    queryKey: ['theme-settings-public'],
    queryFn: async () => {
      try {
        const response = await themeApi.getThemeSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const contactEmail = themeSettings?.contactEmail || 'hello@omnicrm.com';
  const contactPhone = themeSettings?.contactPhone || '+1 (555) 123-4567';
  const contactAddress = themeSettings?.contactAddress || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Contact</p>
          <h1 className="text-4xl font-bold text-slate-900">We'd love to hear from you</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Reach out for product questions, demos, partnerships, or support. We respond quickly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">General</h2>
            {contactEmail && (
              <p className="text-sm text-slate-600">{contactEmail}</p>
            )}
            {contactPhone && (
              <p className="text-sm text-slate-600">{contactPhone}</p>
            )}
            <p className="text-sm text-slate-600">9:00 AM - 6:00 PM (GMT)</p>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Support</h2>
            {contactEmail && (
              <p className="text-sm text-slate-600">{contactEmail}</p>
            )}
            <p className="text-sm text-slate-600">Status: status.omnicrm.com</p>
            <p className="text-sm text-slate-600">Help Center: docs.omnicrm.com</p>
          </div>
        </div>

        {contactAddress && (
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Address</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p>{contactAddress}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

