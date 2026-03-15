import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Terminal, 
  Cpu, 
  Database, 
  Orbit,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id, 10) : NaN;

  const { data: projectResponse, isLoading, error } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId || isNaN(projectId)) return null;
      const response = await projectApi.getById(projectId);
      return response.data.data;
    },
    enabled: !!projectId && !isNaN(projectId),
  });

  const project = projectResponse;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-40 h-40 border-4 border-amber-500/10 rounded-full flex items-center justify-center animate-[spin_15s_linear_infinite]">
            <div className="w-32 h-32 border-4 border-t-amber-500 border-transparent rounded-full animate-spin" />
          </div>
          <Activity className="w-12 h-12 text-amber-500 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-8 text-amber-500 font-mono text-sm tracking-[0.3em] uppercase animate-pulse">Loading Project Data</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-slate-900/40 rounded-[2rem] border border-red-500/20">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Project Not Found</h2>
        <p className="text-slate-400 font-mono text-sm mb-8 text-center max-w-md uppercase tracking-widest">
          The requested project could not be found or access is restricted.
        </p>
        <Button onClick={() => navigate('/client/projects')} className="bg-slate-800 text-white hover:bg-slate-700">
          <ArrowLeft className="mr-2 w-4 h-4" /> Return to Command Center
        </Button>
      </div>
    );
  }

  const latestInvoice = project.invoices && project.invoices.length > 0 ? project.invoices[0] : null;
  const latestPayment = project.payments && project.payments.length > 0 ? project.payments[0] : null;

  // Order Flow Timeline Logic
  const timeline = [
    { label: 'ORDER PLACED', time: project.createdAt, status: 'Completed', icon: Zap },
    { label: 'AGREEMENT SIGNED', time: project.signedAt, status: project.signedAt ? 'Completed' : 'Pending', icon: FileText },
    { label: 'PAYMENT RECEIVED', time: latestPayment?.createdAt, status: latestPayment ? 'Completed' : 'Pending', icon: CreditCard },
    { label: 'PROJECT STARTED', time: latestPayment?.verifiedAt || latestPayment?.paidAt, status: latestPayment?.status === 'Approved' ? 'Completed' : 'Pending', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/client/projects')}
            className="w-14 h-14 bg-slate-900/60 border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-amber-500/80 uppercase tracking-widest">ID_{project.id.toString().padStart(6, '0')}</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">STATUS: ONLINE</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{project.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Update Speed</div>
            <div className="text-lg font-black text-amber-500 tracking-tighter">Live</div>
          </div>
          <div className="w-px h-10 bg-slate-800 mx-2" />
          <div className={`px-4 py-2 rounded-xl border text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
            project.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            project.status === 'InProgress' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
            'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              project.status === 'Completed' ? 'bg-emerald-500' :
              project.status === 'InProgress' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'
            }`} />
            {project.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Live Engine & Matrix */}
        <div className="lg:col-span-3 space-y-8">
          <div className="relative aspect-video rounded-[3rem] bg-slate-900/60 border border-slate-800/50 overflow-hidden backdrop-blur-xl group shadow-2xl">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
            
            {/* Engine SVG Core */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                {/* Outer Rings */}
                <motion.circle 
                  cx="200" cy="200" r="180" 
                  fill="none" stroke="currentColor" strokeWidth="1" 
                  className="text-slate-800"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle 
                  cx="200" cy="200" r="150" 
                  fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 40"
                  className="text-amber-500/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Rotating Hubs */}
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                  {[0, 60, 120, 180, 240, 300].map(deg => (
                    <circle key={deg} cx={200 + 130 * Math.cos(deg * Math.PI / 180)} cy={200 + 130 * Math.sin(deg * Math.PI / 180)} r="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  ))}
                </motion.g>

                {/* Inner Data Flow Gears */}
                <motion.g animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                  <path d="M200 100 L210 110 L200 120 L190 110 Z" fill="#f59e0b" className="opacity-80" />
                  <path d="M200 280 L210 290 L200 300 L190 290 Z" fill="#f59e0b" className="opacity-80" />
                  <path d="M100 200 L110 210 L120 200 L110 190 Z" fill="#f59e0b" className="opacity-80" />
                  <path d="M280 200 L290 210 L300 200 L290 190 Z" fill="#f59e0b" className="opacity-80" />
                </motion.g>

                {/* The Core Glowing Sphere */}
                <defs>
                  <radialGradient id="coreGradient">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <motion.circle 
                  cx="200" cy="200" r="60" 
                  fill="url(#coreGradient)"
                  animate={{ r: [60, 70, 60], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <circle cx="200" cy="200" r="40" fill="#0f172a" stroke="#f59e0b" strokeWidth="4" />
                <Activity className="w-12 h-12 text-amber-500" x="176" y="176" />
                
                {/* Status-specific indicators */}
                {project.status === 'InProgress' && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 90, 180, 270].map(deg => (
                      <motion.line 
                        key={deg}
                        x1={200 + 45 * Math.cos(deg * Math.PI / 180)} 
                        y1={200 + 45 * Math.sin(deg * Math.PI / 180)}
                        x2={200 + 170 * Math.cos(deg * Math.PI / 180)}
                        y2={200 + 170 * Math.sin(deg * Math.PI / 180)}
                        stroke="#f59e0b" strokeWidth="1" strokeDasharray="5 5"
                        animate={{ strokeDashoffset: -20 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ))}
                  </motion.g>
                )}
              </svg>
            </div>

            {/* Live Data Overlays */}
            <div className="absolute top-8 left-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite]" />
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] font-bold">Live Updates</span>
              </div>
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                    SESSION_{i}_CONNECTED
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute top-8 right-8 text-right bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/50">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Global Progress</div>
              <div className="text-2xl font-black text-amber-500 tracking-tighter">
                {project.tasks && project.tasks.length > 0 
                  ? `${Math.round(project.tasks.reduce((acc: number, t: any) => acc + Number(t.progress || 0), 0) / project.tasks.length)}%` 
                  : 'N/A'}
              </div>
            </div>

            <div className="absolute bottom-8 right-8 text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">System Load</div>
              <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '74%' }}
                  className="h-full bg-amber-500 rounded-full"
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
              <div className="mt-1 text-xs font-black text-amber-100 uppercase tracking-tighter">Processing...</div>
            </div>

            {/* HUD Callouts */}
            <div className="absolute bottom-8 left-8 flex gap-4">
              <div className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <Database className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-mono">Storage Used</div>
                  <div className="text-sm font-black text-white uppercase">Data Secure</div>
                </div>
              </div>
              <div className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Orbit className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-mono">Connection</div>
                  <div className="text-sm font-black text-white uppercase">Online</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Flow Protocol */}
            <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md relative h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Settings className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Order Timeline</h3>
              </div>

              <div className="relative space-y-6">
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800" />
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border z-10 ${
                      item.status === 'Completed' ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-xs font-black uppercase tracking-widest ${item.status === 'Completed' ? 'text-white' : 'text-slate-500'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
                        {item.time ? new Date(item.time).toLocaleString() : 'WAITING...'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Intel Module */}
            <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md relative h-full">
               <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <Terminal className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Client Details</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                  <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest mb-1">Client Name</div>
                  <div className="text-lg font-black text-white uppercase tracking-tighter">{project.client?.name || 'Customer'}</div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest mb-1">Organization</div>
                    <div className="text-sm font-black text-amber-100 uppercase truncate">{project.client?.companyName || 'Private Sector'}</div>
                  </div>
                  <div className="flex-1 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest mb-1">Location</div>
                    <div className="text-sm font-black text-emerald-400 uppercase truncate">{project.client?.address || 'Global Grid'}</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">System Connection</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold tracking-widest">SECURE_ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Matrix Section */}
          <div className="p-8 bg-slate-900/60 rounded-[3rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -z-10" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Cpu className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Project Tasks</h3>
                  <div className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">{project.tasks?.length || 0} Tasks Found</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.tasks?.map((task: any, idx: number) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-slate-900/80 rounded-[2rem] border border-slate-800/50 hover:border-emerald-500/30 transition-all group/task"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      task.priority === 'High' ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                      'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      {task.priority}_PRIORITY
                    </div>
                    <span className="text-[8px] font-mono text-slate-600">ID: {task.id}</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-4 line-clamp-1">{task.title}</h4>
                  
                  {/* Task Mini Engine SVG */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg viewBox="0 0 40 40" className="w-full h-full">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#1e293b" strokeWidth="2" />
                        <motion.circle 
                          cx="20" cy="20" r="18" 
                          fill="none" 
                          stroke={task.status === 'Complete' ? '#10b981' : '#3b82f6'} 
                          strokeWidth="2" 
                          strokeDasharray="100"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 100 - Number(task.progress || 0) }}
                        />
                        {task.status !== 'Complete' && (
                          <motion.circle 
                            cx="20" cy="20" r="4" 
                            fill={task.status === 'StartedWorking' ? '#3b82f6' : '#94a3b8'} 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                        {task.status === 'Complete' && (
                          <path d="M14 20 L18 24 L26 16" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{task.status}</span>
                        <span className="text-xs font-black text-white">{Number(task.progress || 0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          className={`h-full rounded-full ${task.status === 'Complete' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>DUE: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </motion.div>
              ))}

              {(!project.tasks || project.tasks.length === 0) && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-40">
                  <Database className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="font-mono text-xs uppercase tracking-widest text-slate-600">No tasks currently assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial & Controls */}
        <div className="space-y-8">
          {/* Financial HUD */}
          <div className="p-8 bg-gradient-to-br from-amber-500/10 to-transparent rounded-[2.5rem] border border-amber-500/30 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -z-10 group-hover:bg-amber-500/20 transition-all" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Finance</h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1">Total Budget</div>
                <div className="text-4xl font-black text-amber-100 flex items-center gap-2">
                  <span className="text-amber-500 text-2xl">$</span>
                  {Number(project.budget).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-800/50">
                <div className="p-4 bg-slate-900/40">
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">Unit Duration</div>
                  <div className="text-sm font-black text-amber-100 uppercase">{project.time}</div>
                </div>
                <div className="p-4 bg-slate-900/40 border-l border-slate-800/50">
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">Risk Status</div>
                  <div className="text-sm font-black text-emerald-400 uppercase tracking-tighter">Low</div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Invoices</h4>
                  <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] font-mono text-slate-400">{project.invoices?.length || 0} Total</div>
                </div>

                <div className="space-y-3">
                  {project.invoices?.map((invoice: any) => (
                    <div key={invoice.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all group/inv cursor-pointer" onClick={() => navigate(`/client/invoices/${invoice.id}`)}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-amber-100 group-hover/inv:text-amber-400 transition-colors uppercase">{invoice.invoiceNumber}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase ${
                          invoice.status === 'Paid' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>${Number(invoice.totalAmount).toLocaleString()}</span>
                        <span>DUE: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {(!project.invoices || project.invoices.length === 0) && (
                    <div className="text-center py-6 text-slate-600 font-mono text-xs uppercase italic bg-slate-900/40 rounded-2xl border border-slate-800/50">No attached invoice records</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6">Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => window.print()}
                className="w-full h-14 bg-slate-800 border border-slate-700 rounded-2xl text-amber-100 font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-sm gap-3"
              >
                <FileText className="w-5 h-5 text-amber-500" />
                DOWNLOAD REPORT
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/client/projects')}
                className="w-full h-14 bg-slate-900/40 border-amber-500/20 rounded-2xl text-amber-500/80 font-black uppercase tracking-widest hover:bg-amber-500/10 transition-all text-sm gap-3"
              >
                <Settings className="w-5 h-5" />
                PROJECT SETTINGS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
