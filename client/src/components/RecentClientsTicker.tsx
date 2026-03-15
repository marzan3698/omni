import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';
import { Sparkles, Zap, ChevronRight } from 'lucide-react';

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function RecentClientsTicker() {
  const { data: feedResponse } = useQuery({
    queryKey: ['projects', 'public-feed'],
    queryFn: async () => {
      const response = await projectApi.getPublicFeed();
      return response.data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const feed = feedResponse || [];
  if (feed.length === 0) return null;

  // Duplicate feed to ensure seamless loop
  const duplicatedFeed = [...feed, ...feed, ...feed];

  return (
    <div className="w-full py-3 bg-amber-500/5 border-b border-amber-500/10 overflow-hidden relative">
      <motion.div
        className="flex items-center gap-16 whitespace-nowrap"
        animate={{
          x: [-100 * feed.length, 0], // Move in opposite direction: Left to Right
        }}
        transition={{
          duration: 30, // Slower for readability
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {duplicatedFeed.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex items-center gap-4 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
                Latest Project
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300">
                {item.clientName.split(' ')[0]}***
              </span>
              <span className="text-xs text-slate-500">from</span>
              <span className="text-sm font-black text-amber-100 group-hover:text-amber-400 transition-colors">
                {item.companyName}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-700" />

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-medium text-slate-400">
                {item.serviceTitle}
              </span>
            </div>

            <span className="text-[10px] font-medium text-slate-600">
              {timeAgo(new Date(item.createdAt))} ago
            </span>

            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 ml-8" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
