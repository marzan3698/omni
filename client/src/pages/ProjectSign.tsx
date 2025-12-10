import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/SignaturePad';
import { ArrowLeft, Calendar, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ProjectSign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [signature, setSignature] = useState<string>('');

  const { data: projectResponse, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectApi.getById(Number(id));
      return response.data.data;
    },
    enabled: !!id,
  });

  const signMutation = useMutation({
    mutationFn: (sig: string) => projectApi.sign(Number(id!), sig),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      
      // Check if invoice was created
      const invoice = response.data?.data?.invoice;
      if (invoice) {
        console.log('Invoice created:', invoice.invoiceNumber);
      } else {
        console.warn('No invoice in response after signing project');
      }
      
      // Navigate back with signed parameter to show processing animation
      navigate(`/client/projects?signed=${id}`);
    },
    onError: (error: any) => {
      console.error('Error signing project:', error);
      const message = error?.response?.data?.message || 'Failed to sign project';
      alert(message);
    },
  });

  const project = projectResponse;
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  // Extract company name from email domain or use a default
  const companyName = user?.email?.split('@')[1]?.split('.')[0] || 'Your Company';
  const userName = user?.email?.split('@')[0] || 'Client';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate('/client/projects')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        {/* Professional Document */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-gray-200">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">DIGITAL MARKETING SERVICES</h1>
                <p className="text-indigo-100 text-lg">Project Proposal & Agreement</p>
              </div>
              <div className="text-right text-indigo-100">
                <p className="text-sm">Document Date</p>
                <p className="font-semibold">{currentDate}</p>
              </div>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-8 space-y-8">
            {/* Parties Section */}
            <div className="grid md:grid-cols-2 gap-8 border-b pb-8">
              <div>
                <h3 className="font-bold text-lg mb-4 text-gray-800">CLIENT INFORMATION</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">Name:</span> {userName}</p>
                  <p><span className="font-semibold">Company:</span> {companyName}</p>
                  <p><span className="font-semibold">Email:</span> {user?.email}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-gray-800">SERVICE PROVIDER</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">Company:</span> Omni Digital Marketing</p>
                  <p><span className="font-semibold">Services:</span> Digital Marketing Solutions</p>
                  <p><span className="font-semibold">Contact:</span> support@omni.com</p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-indigo-600 pb-2">
                PROJECT DETAILS
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.title}</h3>
                  {project.description && (
                    <p className="text-gray-700 leading-relaxed">{project.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Proposal Content */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-indigo-600 pb-2">
                PROPOSED DIGITAL MARKETING SERVICES
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  This proposal outlines the comprehensive digital marketing services we will provide to enhance your online presence, 
                  drive engagement, and achieve your business objectives. Our team specializes in delivering measurable results through 
                  strategic digital marketing campaigns.
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-indigo-600">
                  <h4 className="font-semibold text-lg mb-3 text-gray-900">Services Included:</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Search Engine Optimization (SEO) to improve organic visibility</li>
                    <li>Social Media Marketing and Management across major platforms</li>
                    <li>Content Marketing Strategy and Creation</li>
                    <li>Pay-Per-Click (PPC) Advertising Campaigns</li>
                    <li>Email Marketing Campaigns and Automation</li>
                    <li>Analytics and Performance Reporting</li>
                    <li>Website Optimization and Conversion Rate Optimization</li>
                  </ul>
                </div>

                <p>
                  Our approach combines data-driven strategies with creative execution to maximize your return on investment. 
                  We will work closely with your team to ensure all campaigns align with your brand voice and business goals.
                </p>
              </div>
            </div>

            {/* Project Terms */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4 text-gray-900">PROJECT TERMS</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Total Budget</p>
                    <p className="text-2xl font-bold text-indigo-600">${Number(project.budget).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Project Timeline</p>
                    <p className="text-xl font-bold text-indigo-600">{project.time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">TERMS AND CONDITIONS</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  1. Payment terms: 50% upfront payment required to commence work, remaining 50% upon project completion.
                </p>
                <p>
                  2. All deliverables will be provided according to the agreed timeline. Any delays will be communicated in advance.
                </p>
                <p>
                  3. Client will provide necessary access, content, and approvals in a timely manner to ensure project success.
                </p>
                <p>
                  4. Intellectual property rights for custom work will transfer to the client upon final payment.
                </p>
                <p>
                  5. This agreement may be terminated by either party with 30 days written notice.
                </p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-gray-300 pt-8">
              <h3 className="font-bold text-lg mb-6 text-gray-900">ELECTRONIC SIGNATURE</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Please sign below to accept this proposal and authorize the project:
                  </label>
                  <SignaturePad onSignatureChange={setSignature} />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={!!signature}
                    readOnly
                    className="w-4 h-4 text-indigo-600"
                  />
                  <label htmlFor="agree">
                    By signing above, I acknowledge that I have read, understood, and agree to the terms and conditions 
                    outlined in this proposal. I authorize Omni Digital Marketing to proceed with the project as described.
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => signMutation.mutate(signature)}
                    disabled={!signature || signMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {signMutation.isPending ? 'Submitting...' : 'Submit & Sign Document'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/client/projects')}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 text-center text-xs text-gray-500">
              <p>This is an electronically generated document. By signing, you agree to the terms and conditions stated above.</p>
              <p className="mt-2">Document ID: PROJ-{project.id} | Generated on {currentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

