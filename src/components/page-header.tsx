import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 页面标题组件 - Liquid Glass 风格
 * 支持标题、副标题和操作按钮区域
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className }) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 backdrop-blur-xl',
        'bg-white/60 dark:bg-black/30',
        'border border-white/30 dark:border-white/10',
        'shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]',
        actions ? 'flex justify-between items-center' : '',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
