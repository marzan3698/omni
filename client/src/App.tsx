import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionGuard } from './components/PermissionGuard';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { ClientLayout } from './components/ClientLayout';
import { ClientDashboard } from './pages/ClientDashboard';
import { ClientProjects } from './pages/ClientProjects';
import { ClientCampaigns } from './pages/ClientCampaigns';
import { ClientLeads } from './pages/ClientLeads';
import { ProjectSign } from './pages/ProjectSign';
import { Inbox } from './pages/Inbox';
import InboxReport from './pages/InboxReport';
import { Settings } from './pages/Settings';
import { Companies } from './pages/Companies';
import { Employees } from './pages/Employees';
import EmployeeGroups from './pages/EmployeeGroups';
import { UserDetail } from './pages/UserDetail';
import { Tasks } from './pages/Tasks';
import { TaskDetail } from './pages/TaskDetail';
import { Finance } from './pages/Finance';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { MeetingSchedule } from './pages/MeetingSchedule';
import { CallSchedule } from './pages/CallSchedule';
import { MyCalls } from './pages/MyCalls';
import Users from './pages/Users';
import LeadConfig from './pages/LeadConfig';
import SystemSettings from './pages/SystemSettings';
import ThemeDesign from './pages/ThemeDesign';
import ManageHomepage from './pages/ManageHomepage';
import ManageHeader from './pages/ManageHeader';
import ManageColors from './pages/ManageColors';
import PaymentSettings from './pages/PaymentSettings';
import PaymentManagement from './pages/PaymentManagement';
import Roles from './pages/Roles';
import TaskConfig from './pages/TaskConfig';
import Integrations from './pages/Integrations';
import FacebookOAuthCallback from './pages/FacebookOAuthCallback';
import EnvironmentFileEditing from './pages/EnvironmentFileEditing';
import Campaigns from './pages/Campaigns';
import CampaignForm from './pages/CampaignForm';
import CampaignDetail from './pages/CampaignDetail';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductView from './pages/ProductView';
import ProductCategories from './pages/ProductCategories';
import ProductCategoryForm from './pages/ProductCategoryForm';
import { Services } from './pages/Services';
import { ServiceForm } from './pages/ServiceForm';
import { AdminProjectsClients } from './pages/AdminProjectsClients';
import { ClientInvoices } from './pages/ClientInvoices';
import { InvoiceView } from './pages/InvoiceView';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import ServicesPage from './pages/public/ServicesPage';
import Sitemap from './pages/public/Sitemap';

function App() {
  // Redirect /install to home immediately on mount
  useEffect(() => {
    if (window.location.pathname === '/install') {
      window.location.replace('/');
    }
  }, []);

  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inbox />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox-report"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <InboxReport />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_integrations">
                      <Settings />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Companies />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Employees />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-groups"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeGroups />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-groups/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeGroups />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Finance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Leads />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeadDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meeting-schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_leads">
                      <MeetingSchedule />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/call-schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_leads">
                      <CallSchedule />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-calls"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyCalls />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lead-config"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeadConfig />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SystemSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/theme-design"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <ThemeDesign />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/theme-design/homepage/hero"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <ManageHomepage />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/theme-design/homepage/header"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <ManageHeader />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/theme-design/homepage/colors"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <ManageColors />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Roles />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/task-config"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskConfig />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Integrations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Campaigns />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_campaigns">
                      <CampaignForm />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_campaigns">
                      <CampaignForm />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_campaigns">
                      <CampaignDetail />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductView />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductCategories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-categories/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductCategoryForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_products">
                      <Services />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_products">
                      <ServiceForm />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_products">
                      <ServiceForm />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects-clients"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_companies">
                      <AdminProjectsClients />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/environment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionGuard permission="can_manage_root_items">
                      <EnvironmentFileEditing />
                    </PermissionGuard>
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/install" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/facebook-oauth-callback" element={<FacebookOAuthCallback />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/sitemap" element={<Sitemap />} />

            {/* Client routes */}
            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ClientDashboard />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ClientProjects />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/campaigns"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ClientCampaigns />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/leads"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ClientLeads />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects/:id/sign"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ProjectSign />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <ClientInvoices />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/invoices/:id"
              element={
                <ProtectedRoute>
                  <ClientLayout>
                    <InvoiceView />
                  </ClientLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect - will be handled by AuthContext based on role */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
