import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotaPolicy {
  id: string;
  name: string;
  dailyTokenLimit: number;
  rpmLimit: number;
  maxContextLength: number;
}

interface QuotaCardProps {
  policy: QuotaPolicy;
  onEdit: (policy: QuotaPolicy) => void;
  onDelete: (id: string) => void;
}

const QuotaCard: React.FC<QuotaCardProps> = (props) => {
  const { policy, onEdit, onDelete } = props;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-text-dark">{policy.name}</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(policy)}
            className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(policy.id)}
            className="h-8 w-8 text-[var(--muted-foreground)] hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>每日 Token 上限</span>
            <span>{formatNumber(policy.dailyTokenLimit)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>每分钟请求次数</span>
            <span>{policy.rpmLimit} RPM</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-warning-500 h-2 rounded-full" style={{ width: '30%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>最大上下文长度</span>
            <span>{formatNumber(policy.maxContextLength)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-success-500 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
        <Button variant="ghost" className="w-full">
          查看详情
        </Button>
      </div>
    </div>
  );
};

export default QuotaCard;
