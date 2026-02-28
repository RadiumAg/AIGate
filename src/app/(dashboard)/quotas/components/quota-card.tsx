import React from 'react';
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(policy.id)}
            className="h-8 w-8 text-[var(--muted-foreground)] hover:text-red-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
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
