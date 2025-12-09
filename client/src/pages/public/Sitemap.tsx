import { PublicHeader } from '@/components/PublicHeader';

export default function Sitemap() {
  const links = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Services', path: '/services' },
    { title: 'Contact', path: '/contact' },
    { title: 'Terms', path: '/terms' },
    { title: 'Privacy', path: '/privacy' },
    { title: 'Sitemap', path: '/sitemap' },
    { title: 'Login', path: '/login' },
    { title: 'Register', path: '/register' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Sitemap</p>
          <h1 className="text-4xl font-bold text-slate-900">All public pages</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Quick access to every public-facing page on Omni CRM.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {links.map((link) => (
            <div key={link.title} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{link.title}</p>
                <p className="text-xs text-slate-500">{link.path}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

