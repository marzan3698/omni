import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ArrowRight, 
  LayoutDashboard, 
  Briefcase,
  Sparkles,
  PartyPopper,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      {/* Success Animation Container */}
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', damping: 15 }}
        className="relative mb-10"
      >
        <div className="w-32 h-32 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 relative z-10">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        </div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-4 -right-4"
        >
          <Sparkles className="w-10 h-10 text-amber-500 opacity-50" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -bottom-2 -left-6"
        >
          <PartyPopper className="w-12 h-12 text-blue-400 opacity-50" />
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center max-w-lg"
      >
        <h1 className="text-5xl font-black text-amber-100 mb-4 tracking-tight">
          Thank You for <br />
          <span className="text-emerald-500">Your Trust!</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium leading-relaxed mb-10">
          Your order has been placed successfully. We've automatically created your projects and generated invoices.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {id && (
            <Button 
              onClick={() => navigate(`/client/invoices/${id}`)}
              className="w-full sm:w-auto h-14 px-8 bg-emerald-500 text-slate-900 hover:bg-emerald-400 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 transition-all group"
            >
              <FileText className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
              View Invoice
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          <Button 
            onClick={() => navigate('/client/projects')}
            className={`w-full sm:w-auto h-14 px-8 ${id ? 'bg-slate-800 border-slate-700 text-amber-100 hover:bg-slate-700' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'} font-black text-lg rounded-2xl transition-all group`}
          >
            <Briefcase className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            View My Projects
            {!id && <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/client')}
            className="w-full sm:w-auto h-14 px-8 border-slate-700 bg-slate-800/40 text-amber-100 hover:bg-slate-800 font-bold text-lg rounded-2xl transition-all"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm max-w-md"
      >
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-1">What's Next?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our team will review your order details and start processing within 24 hours. You'll receive updates directly on your project dashboard.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
