import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TECH_STACK = [
  { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'PHP', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'Laravel', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg' },
  { name: 'WordPress', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg' },
  { name: 'MySQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'TypeScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'Next.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'Tailwind', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg' },
];

export function TechStackTicker() {
  // Duplicate stack to ensure seamless loop
  const duplicatedTech = [...TECH_STACK, ...TECH_STACK];

  return (
    <div className="w-full py-4 bg-slate-900/40 border-y border-amber-500/10 backdrop-blur-sm overflow-hidden relative">
      {/* Gradients for masks */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10" />

      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{
          x: [0, -100 * TECH_STACK.length],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {duplicatedTech.map((tech, index) => (
          <div
            key={`${tech.name}-${index}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800/50 p-1.5 border border-slate-700/50 group-hover:border-amber-500/30 transition-all duration-300">
              <img
                src={tech.logo}
                alt={tech.name}
                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-200/70 uppercase tracking-widest transition-colors">
              {tech.name}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20 ml-8" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
