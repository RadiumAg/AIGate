'use client';

import React from 'react';

interface QuotaOverviewItemProps {
  label: string;
  value: string;
  limit: string;
  percentage: number;
}

const QuotaOverviewItem: React.FC<QuotaOverviewItemProps> = (props) => {
  const { label, value, limit, percentage } = props;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-900 dark:text-text-dark">
          {value} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`${
            percentage > 80
              ? 'bg-danger-500'
              : percentage > 60
                ? 'bg-warning-500'
                : 'bg-primary-500'
          } h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuotaOverviewItem;
