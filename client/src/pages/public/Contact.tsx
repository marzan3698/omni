import { PublicHeader } from '@/components/PublicHeader';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Contact</p>
          <h1 className="text-4xl font-bold text-slate-900">We’d love to hear from you</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Reach out for product questions, demos, partnerships, or support. We respond quickly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">General</h2>
            <p className="text-sm text-slate-600">hello@omnicrm.com</p>
            <p className="text-sm text-slate-600">+1 (555) 123-4567</p>
            <p className="text-sm text-slate-600">9:00 AM - 6:00 PM (GMT)</p>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Support</h2>
            <p className="text-sm text-slate-600">support@omnicrm.com</p>
            <p className="text-sm text-slate-600">Status: status.omnicrm.com</p>
            <p className="text-sm text-slate-600">Help Center: docs.omnicrm.com</p>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Regional offices</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold">Dhaka, Bangladesh:</span> 123 Innovation Road, Level 5</p>
            <p><span className="font-semibold">New York, USA:</span> 200 Madison Ave, Suite 10</p>
          </div>
        </div>
      </div>
    </div>
  );
}

