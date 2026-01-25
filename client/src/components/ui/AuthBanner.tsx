import { Star, Shield, Zap, Users } from 'lucide-react';

interface AuthBannerProps {
  variant?: 'login' | 'register';
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  logoType?: 'wide' | 'with-text';
}

export function AuthBanner({
  variant = 'login',
  primaryColor = '#4f46e5',
  secondaryColor = '#7c3aed',
  logoUrl = null,
  logoType = 'wide',
}: AuthBannerProps) {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Manager',
      text: 'Omni CRM transformed how we manage our clients. Highly recommended!',
      image: '👩‍💼',
    },
    {
      name: 'Michael Chen',
      role: 'Sales Director',
      text: 'The best investment for our sales team. Results speak for themselves.',
      image: '👨‍💼',
    },
  ];

  // Helper function to darken a color
  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const fullHex = hex.length === 3
      ? hex.split('').map(char => char + char).join('')
      : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    const darkerR = Math.max(0, r - amount);
    const darkerG = Math.max(0, g - amount);
    const darkerB = Math.max(0, b - amount);
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const darkerPrimary = darkenColor(primaryColor, 30);
  const darkerSecondary = darkenColor(secondaryColor, 30);

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Lightning Fast',
      description: 'Optimized performance for maximum productivity',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure',
      description: 'Enterprise-grade security for your data',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Collaborative',
      description: 'Built for teams to work together seamlessly',
    },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}, ${darkerSecondary})`,
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: secondaryColor, animationDelay: '2s' }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              logoType === 'wide' ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-14 object-contain"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-14 w-14 object-contain"
                  />
                  <div>
                    <h1 className="text-white text-3xl font-bold">Omni CRM</h1>
                    <p className="text-white/80 text-sm">Modern Business Management</p>
                  </div>
                </div>
              )
            ) : (
              <>
                <div
                  className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <span className="text-white font-bold text-2xl">O</span>
                </div>
                <div>
                  <h1 className="text-white text-3xl font-bold">Omni CRM</h1>
                  <p className="text-white/80 text-sm">Modern Business Management</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main features section */}
        <div className="space-y-8 my-8">
          <h2 className="text-white text-2xl font-bold leading-tight">
            {variant === 'login'
              ? 'Welcome to Your Enterprise Management System'
              : 'Start Your Journey with Us'}
          </h2>

          {/* Features grid */}
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex gap-4 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex-shrink-0" style={{ color: '#e0e7ff' }}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-white/80 text-xs mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials section */}
        <div className="space-y-4 border-t border-white/20 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span className="text-white text-sm font-semibold">Trusted by 1000+ companies</span>
          </div>

          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{testimonial.image}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-yellow-300 fill-yellow-300"
                        />
                      ))}
                    </div>
                    <p className="text-white text-sm leading-relaxed">{testimonial.text}</p>
                    <div className="mt-2">
                      <p className="text-white text-xs font-semibold">{testimonial.name}</p>
                      <p className="text-white/70 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-white/80 text-xs border-t border-white/20 pt-6 mt-8">
          <p>© 2024 Omni CRM. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
