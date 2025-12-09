import { PublicHeader } from '@/components/PublicHeader';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900">Terms & Conditions</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            These terms explain how you can use Omni CRM products and services. By accessing the platform you agree to these conditions.
          </p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Section title="Use of service">
            Users must maintain accurate account information and keep credentials secure. Access is role-based and may be revoked for misuse.
          </Section>
          <Section title="Data handling">
            We protect customer data with encryption in transit and at rest. Usage is governed by our Privacy Policy and applicable data laws.
          </Section>
          <Section title="Payments and billing">
            Fees are billed per agreement. Late payments may suspend access until resolved. Refunds follow our SLA and contract terms.
          </Section>
          <Section title="Acceptable use">
            No unlawful, abusive, or harmful activity. Do not attempt to disrupt services, probe security, or misuse integrations.
          </Section>
          <Section title="Liability">
            Omni CRM is provided “as is” subject to contractual SLAs. We are not liable for indirect or consequential damages except as required by law.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p>{children}</p>
    </div>
  );
}

