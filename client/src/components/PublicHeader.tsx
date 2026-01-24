import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { themeApi, headerApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

export function PublicHeader() {
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

  // Fetch header settings (public endpoint - no auth required)
  const { data: headerSettings } = useQuery({
    queryKey: ['header-settings-public'],
    queryFn: async () => {
      try {
        const response = await headerApi.getHeaderSettings();
        return response.data.data;
      } catch (error) {
        console.error('Error fetching header settings:', error);
        // Return defaults if API fails (for public pages)
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter for faster updates)
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const siteLogo = themeSettings?.siteLogo || null;
  const siteName = themeSettings?.siteName || 'Omni CRM';

  // Use header settings or defaults
  const menuAbout = headerSettings?.menuAbout || 'About';
  const menuServices = headerSettings?.menuServices || 'Services';
  const menuContact = headerSettings?.menuContact || 'Contact';
  const menuTerms = headerSettings?.menuTerms || 'Terms';
  const menuPrivacy = headerSettings?.menuPrivacy || 'Privacy';
  const menuSitemap = headerSettings?.menuSitemap || 'Sitemap';
  const buttonPrimaryText = headerSettings?.buttonPrimaryText || 'Get Started';
  const buttonSecondaryText = headerSettings?.buttonSecondaryText || 'Sign In';
  const backgroundColor = headerSettings?.backgroundColor || '#ffffff';
  const textColor = headerSettings?.textColor || '#1e293b';
  const buttonBgColor = headerSettings?.buttonBgColor || '#4f46e5';
  const buttonTextColor = headerSettings?.buttonTextColor || '#ffffff';
  const buttonSecondaryBgColor = headerSettings?.buttonSecondaryBgColor || 'transparent';
  const buttonSecondaryTextColor = headerSettings?.buttonSecondaryTextColor || '#1e293b';
  const isFixed = headerSettings?.isFixed || false;
  const isTransparent = headerSettings?.isTransparent || false;
  const headerLogo = headerSettings?.logo || null;
  const logoType = headerSettings?.logoType || 'with-text';

  const links = [
    { label: menuAbout, href: '/about' },
    { label: menuServices, href: '/services' },
    { label: menuContact, href: '/contact' },
    { label: menuTerms, href: '/terms' },
    { label: menuPrivacy, href: '/privacy' },
    { label: menuSitemap, href: '/sitemap' },
  ];

  // Determine header classes based on settings
  const headerClasses = cn(
    isTransparent ? '' : 'border-b border-gray-200',
    isFixed ? 'fixed top-0 z-50 w-full' : isTransparent ? 'absolute top-0 z-50 w-full' : 'relative',
    isTransparent && 'backdrop-blur-sm'
  );

  // Determine header styles
  const headerStyle: React.CSSProperties = {
    backgroundColor: isTransparent ? 'transparent' : backgroundColor,
    color: textColor,
    borderBottom: isTransparent ? 'none' : undefined,
  };

  return (
    <header className={headerClasses} style={headerStyle}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {headerLogo ? (
            <>
              <img
                src={getImageUrl(headerLogo)}
                alt={siteName}
                className={logoType === 'wide' ? 'h-12 w-auto max-w-[250px]' : 'h-10 w-auto max-w-[180px]'}
                style={{ objectFit: 'contain' }}
              />
              {logoType === 'with-text' && (
                <span className="text-xl font-bold" style={{ color: textColor }}>
                  {siteName}
                </span>
              )}
            </>
          ) : siteLogo ? (
            <>
              <img
                src={getImageUrl(siteLogo)}
                alt={siteName}
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold" style={{ color: textColor }}>
                {siteName}
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="text-xl font-bold" style={{ color: textColor }}>
                {siteName}
              </span>
            </>
          )}
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: textColor }}>
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="hover:opacity-80 transition-opacity"
              style={{ color: textColor }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              className="hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: buttonSecondaryBgColor === 'transparent' ? 'transparent' : buttonSecondaryBgColor,
                color: buttonSecondaryTextColor,
                border: buttonSecondaryBgColor === 'transparent' ? `1px solid ${buttonSecondaryTextColor}` : 'none',
              }}
            >
              {buttonSecondaryText}
            </Button>
          </Link>
          <Link to="/register">
            <Button
              className="hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
                border: 'none',
              }}
            >
              {buttonPrimaryText}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

