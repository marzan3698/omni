import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  const links = [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Sitemap', href: '/sitemap' },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Omni CRM</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-700">
          {links.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

