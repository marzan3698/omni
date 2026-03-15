import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectApi, serviceApi, productApi, serviceCategoryApi } from '@/lib/api';
import { WelcomePresentationModal } from '@/components/WelcomePresentationModal';
import { ClientDashboardHero } from '@/components/ClientDashboardHero';
import { ClientServicesByCategory } from '@/components/ClientServicesByCategory';
import { TechStackTicker } from '@/components/TechStackTicker';
import { RecentClientsTicker } from '@/components/RecentClientsTicker';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';

export function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchTerm, selectedCategoryId, setSelectedCategoryId, addToCart } = useShop();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasUserDismissedWelcome, setHasUserDismissedWelcome] = useState(false);

  const { data: statsResponse } = useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const response = await projectApi.getStats();
      return response.data.data;
    },
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['service-categories-client', user?.companyId],
    queryFn: async () => {
      const response = await serviceCategoryApi.getListForClient();
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const stats = statsResponse || { total: 0, active: 0, completed: 0 };
  const categories = categoriesResponse || [];

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
      const response = await productApi.list(user.companyId);
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

  const handleStartProject = (preSelectService?: any) => {
    setHasUserDismissedWelcome(true);
    setShowWelcomeModal(false);
    
    if (preSelectService) {
      addToCart(preSelectService);
      navigate('/client/checkout');
    } else {
      navigate('/client/projects');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('open-project-form', {})
        );
      }, 100);
    }
  };

  return (
    <div className="space-y-8 min-h-screen">
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

      {/* Hero Section - Banner Style */}
      <ClientDashboardHero onStartProject={handleStartProject} />

      {/* Activity Feeds */}
      <RecentClientsTicker />
      <TechStackTicker />

      <div className="relative">
        {/* Main Product/Service Display */}
        {user?.companyId && (
          <div id="shop-content">
            <ClientServicesByCategory
              companyId={user.companyId}
              onStartProject={handleStartProject}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              searchTerm={searchTerm}
            />
          </div>
        )}
      </div>
    </div>
  );
}
