import { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Users, Briefcase, Target, BarChart3, MessageSquare, Star, Newspaper, TrendingUp, LineChart } from 'lucide-react';
import { socialApi } from '@/lib/social';
import { contentApi } from '@/lib/content';

export function Landing() {
  const { data: analytics } = useQuery({
    queryKey: ['public-conversation-analytics'],
    queryFn: () => socialApi.getPublicAnalytics(30),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['public-reviews'],
    queryFn: () => contentApi.getPublicReviews(6),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['public-posts'],
    queryFn: () => contentApi.getPublicPosts(3),
  });

  const dailySeries = analytics?.daily.slice(-14) || [];
  const maxMessages = dailySeries.reduce((max, d) => Math.max(max, d.messages), 0);

  const platformStats = [
    { label: 'Facebook', value: analytics?.platformBreakdown.facebook || 0, color: 'text-indigo-600' },
    { label: 'Chatwoot', value: analytics?.platformBreakdown.chatwoot || 0, color: 'text-emerald-600' },
    { label: 'Other', value: analytics?.platformBreakdown.other || 0, color: 'text-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Omni CRM</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Streamline Your Business Operations
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Complete CRM and project management solution for modern businesses.
          Manage leads, campaigns, projects, and clients all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Everything You Need to Manage Your Business
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: 'Client Management',
              description: 'Register clients, projects, and track milestones seamlessly.',
              points: ['Easy project creation', 'E-signature support', 'Status tracking'],
            },
            {
              icon: Target,
              title: 'Campaign Management',
              description: 'Plan, launch, and report on marketing campaigns.',
              points: ['Multi-client campaigns', 'Product assignments', 'Lead tracking'],
            },
            {
              icon: Briefcase,
              title: 'Project Tracking',
              description: 'Monitor delivery health from draft to completion.',
              points: ['Real-time updates', 'Document management', 'Timeline visibility'],
            },
            {
              icon: BarChart3,
              title: 'Lead Analytics',
              description: 'Actionable insights for every campaign and channel.',
              points: ['Campaign-based leads', 'Detailed insights', 'Filter by source'],
            },
            {
              icon: CheckCircle,
              title: 'Secure & Reliable',
              description: 'Enterprise-grade security and observability.',
              points: ['Data encryption', '99.9% uptime', 'Regular backups'],
            },
            {
              icon: Users,
              title: 'Team Collaboration',
              description: 'Roles, permissions, and shared dashboards.',
              points: ['Role-based access', 'Shared dashboards', 'Real-time sync'],
            },
          ].map((item) => (
            <Card key={item.title} className="shadow-sm border-gray-200">
              <CardHeader>
                <item.icon className="w-10 h-10 text-indigo-600 mb-2" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Conversation Analytics */}
      <section className="bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                <MessageSquare className="w-4 h-4" />
                Conversation Insights
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-3">
                Live conversation health in one glance
              </h2>
              <p className="text-slate-600 mb-6 max-w-xl">
                Track message volume, open vs closed threads, and platform performance pulled directly from your inbox data.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Total Conversations"
                  value={analytics?.totalConversations ?? '—'}
                  icon={LineChart}
                  accent="bg-indigo-100 text-indigo-700"
                />
                <StatCard
                  title="Open Conversations"
                  value={analytics?.openConversations ?? '—'}
                  icon={TrendingUp}
                  accent="bg-amber-100 text-amber-700"
                />
                <StatCard
                  title="Closed"
                  value={analytics?.closedConversations ?? '—'}
                  icon={CheckCircle}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Platform mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {platformStats.map((p) => (
                      <div key={p.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{p.label}</span>
                        <span className={`font-semibold ${p.color}`}>{p.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message trend (14 days)</CardTitle>
                    <CardDescription>Pulled from live conversation activity</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="inline-block w-3 h-3 rounded-full bg-indigo-500"></span>
                    Messages
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-2">
                  {dailySeries.map((day) => {
                    const height = maxMessages ? Math.round((day.messages / maxMessages) * 100) : 0;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-md bg-indigo-500 transition-all"
                          style={{ height: `${Math.max(6, height)}%` }}
                          title={`${day.messages} messages on ${day.date}`}
                        />
                        <span className="text-[11px] text-slate-500">
                          {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(day.date))}
                        </span>
                      </div>
                    );
                  })}
                  {dailySeries.length === 0 && (
                    <div className="text-sm text-slate-500">No activity yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
              <Star className="w-4 h-4" />
              Customer Reviews
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">Loved by modern teams</h2>
            <p className="text-slate-600 mt-2">Feedback from teams running their operations on Omni.</p>
          </div>
          <Link to="/register">
            <Button variant="outline">Start Free Trial</Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{review.authorName}</CardTitle>
                    <CardDescription>{review.role || 'Customer'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">“{review.comment}”</p>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
            <div className="col-span-full text-center text-slate-500">Reviews will appear once added.</div>
          )}
        </div>
      </section>

      {/* Blog */}
      <section className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <Newspaper className="w-4 h-4" />
                Latest from the blog
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mt-3">Insights, playbooks, and releases</h2>
              <p className="text-slate-600 mt-2">Stay ahead with product updates and GTM guides.</p>
            </div>
            <Link to="/register">
              <Button variant="ghost" className="text-indigo-600">
                Join Omni
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="shadow-sm border-gray-200 h-full flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Coming soon'}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 mt-2">{post.title}</h3>
                  <p className="text-slate-600 text-sm mt-2 flex-1">{post.excerpt || 'Read the latest updates from the Omni team.'}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-indigo-600 text-sm font-medium">
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="col-span-full text-center text-slate-500">Blog posts will appear once published.</div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of businesses using Omni CRM to manage their operations
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100">
              Create Your Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2024 Omni CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center ${accent}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm text-slate-600">{title}</CardTitle>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

