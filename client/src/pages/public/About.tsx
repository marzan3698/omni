import { PublicHeader } from '@/components/PublicHeader';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">About Omni</p>
          <h1 className="text-4xl font-bold text-slate-900">Built for modern revenue and operations teams</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Omni CRM is crafted to help teams orchestrate campaigns, leads, and projects in one connected workspace.
            We blend CRM, project delivery, and inbox visibility so your team can move from lead to closed-won to delivery
            without silos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Mission', desc: 'Help companies unify revenue, service, and delivery workflows in a single operating system.' },
            { title: 'Vision', desc: 'A connected customer journey where every conversation, task, and milestone stays in sync.' },
            { title: 'Values', desc: 'Clarity, reliability, and speed. We ship fast, stay transparent, and keep data secure.' },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-lg border border-gray-200 bg-white shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">What we deliver</h2>
          <ul className="list-disc list-inside text-slate-700 space-y-2">
            <li>Unified CRM with projects, finance, and campaigns in one place.</li>
            <li>Inbox visibility across channels with analytics on conversation health.</li>
            <li>Role-based permissions, auditability, and secure data handling.</li>
            <li>API-first integrations for Chatwoot, Facebook, and your tooling.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

