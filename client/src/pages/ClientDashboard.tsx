import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectApi, serviceApi, productApi } from '@/lib/api';
import { WelcomePresentationModal } from '@/components/WelcomePresentationModal';
import { ClientDashboardHero } from '@/components/ClientDashboardHero';
import { ClientServicesByCategory } from '@/components/ClientServicesByCategory';
import { useAuth } from '@/contexts/AuthContext';

export function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasUserDismissedWelcome, setHasUserDismissedWelcome] = useState(false);

  const { data: statsResponse } = useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const response = await projectApi.getStats();
      return response.data.data;
    },
  });

  const stats = statsResponse || { total: 0, active: 0, completed: 0 };

  // Check if we should show welcome modal (when stats are loaded and total is 0)
  const shouldShowWelcome = stats.total === 0 && statsResponse !== undefined;

  // Fetch services for welcome modal (only when we should show welcome)
  const { data: servicesResponse } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
    enabled: shouldShowWelcome,
  });

  // Fetch products for welcome modal (only when we should show welcome)
  const { data: productsResponse } = useQuery({
    queryKey: ['products', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: shouldShowWelcome && !!user?.companyId,
  });

  const services = servicesResponse || [];
  const products = productsResponse || [];

  // Show welcome modal when stats indicate no projects (only once, until user closes it)
  useEffect(() => {
    if (shouldShowWelcome && !hasUserDismissedWelcome) {
      setShowWelcomeModal(true);
    }
  }, [shouldShowWelcome, hasUserDismissedWelcome]);

  const handleCloseWelcome = () => {
    setHasUserDismissedWelcome(true);
    setShowWelcomeModal(false);
  };

  const handleStartProject = (preSelectService?: unknown) => {
    setHasUserDismissedWelcome(true);
    setShowWelcomeModal(false);
    navigate('/client/projects');
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('open-project-form', preSelectService ? { detail: { preSelectService } } : {})
      );
    }, 100);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Presentation Modal */}
      {shouldShowWelcome && (
        <WelcomePresentationModal
          isOpen={showWelcomeModal}
          onClose={handleCloseWelcome}
          services={services}
          products={products}
          onStartProject={handleStartProject}
        />
      )}

      {/* Hero Section */}
      <ClientDashboardHero onStartProject={handleStartProject} />

      {/* Services by Category */}
      {user?.companyId && (
        <ClientServicesByCategory
          companyId={user.companyId}
          onStartProject={handleStartProject}
        />
      )}
    </div>
  );
}
