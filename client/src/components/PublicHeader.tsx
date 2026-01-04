import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { themeApi } from '@/lib/api';

export function PublicHeader() {
  const links = [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Sitemap', href: '/sitemap' },
  ];

  // Fetch theme settings (public endpoint - no auth required)
  const { data: themeSettings } = useQuery({
    queryKey: ['theme-settings-public'],
    queryFn: async () => {
      try {
        const response = await themeApi.getThemeSettings();
        return response.data.data;
      } catch (error) {
        // Return defaults if API fails (for public pages)
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const siteLogo = themeSettings?.siteLogo || null;
  const siteName = themeSettings?.siteName || 'Omni CRM';
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {siteLogo ? (
            <img
              src={siteLogo.startsWith('/') ? `${apiBaseUrl}${siteLogo}` : siteLogo}
              alt={siteName}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
          )}
          <span className="text-xl font-bold text-slate-900">{siteName}</span>
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

