import React from 'react';

interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  description,
  actions,
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
        <span className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/25 shadow-inner">
          <Icon className="w-5 h-5 text-emerald-400" />
        </span>
        <span>{title}</span>
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 ml-[52px]">
        {description}
      </p>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
