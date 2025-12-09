import { PublicHeader } from '@/components/PublicHeader';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Privacy</p>
          <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            We respect your data. This policy outlines what we collect, how we use it, and your rights.
          </p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Section title="Data we collect">
            Account details, usage analytics, and integration metadata to deliver the service. Sensitive data is minimized.
          </Section>
          <Section title="How we use data">
            To provide features, support, security, and product improvements. We do not sell personal data.
          </Section>
          <Section title="Sharing">
            Shared only with processors under contract (hosting, analytics) and as required by law.
          </Section>
          <Section title="Security">
            Encryption in transit/at rest, least-privilege access, logging, and routine security reviews.
          </Section>
          <Section title="Your rights">
            Access, correction, deletion, and export of your data. Contact privacy@omnicrm.com for requests.
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

