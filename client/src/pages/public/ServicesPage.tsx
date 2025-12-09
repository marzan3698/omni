import { PublicHeader } from '@/components/PublicHeader';

export default function ServicesPage() {
  const services = [
    {
      title: 'CRM & Pipeline',
      desc: 'Lead capture, qualification, pipeline stages, and conversion with inbox context.',
    },
    {
      title: 'Campaign Operations',
      desc: 'Plan, launch, and track campaigns with product links, budgets, and performance.',
    },
    {
      title: 'Project Delivery',
      desc: 'Project timelines, milestones, signatures, and client portals for delivery.',
    },
    {
      title: 'Finance & Invoicing',
      desc: 'Quotes, invoices, payments, and revenue tracking tied to deals and projects.',
    },
    {
      title: 'Analytics & Reporting',
      desc: 'Conversation health, campaign insights, lead funnels, and financial summaries.',
    },
    {
      title: 'Integrations',
      desc: 'Chatwoot, Facebook, webhooks, and API-first design to fit your stack.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Services</p>
          <h1 className="text-4xl font-bold text-slate-900">Everything you need to run revenue and delivery</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Modular capabilities so sales, marketing, support, and delivery teams stay aligned.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.title} className="p-5 rounded-lg border border-gray-200 bg-white shadow-sm space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

