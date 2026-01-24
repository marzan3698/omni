import { Star, Shield, Zap, Users } from 'lucide-react';

interface AuthBannerProps {
  variant?: 'login' | 'register';
}

export function AuthBanner({ variant = 'login' }: AuthBannerProps) {
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
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">Omni CRM</h1>
              <p className="text-indigo-100 text-sm">Modern Business Management</p>
            </div>
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
                <div className="text-indigo-200 flex-shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-indigo-100 text-xs mt-1">{feature.description}</p>
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
                      <p className="text-indigo-200 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-indigo-100 text-xs border-t border-white/20 pt-6 mt-8">
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
