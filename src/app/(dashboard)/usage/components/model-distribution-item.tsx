'use client';

import { FC } from 'react';

interface ModelDistributionItemProps {
  model: string;
  percentage: number;
  color: string;
}

const ModelDistributionItem: FC<ModelDistributionItemProps> = (props) => {
  const { model, percentage, color } = props;

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-500';
      case 'warning':
        return 'bg-warning-500';
      case 'success':
        return 'bg-success-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 dark:text-gray-300">{model}</span>
        <span className="font-medium text-gray-900 dark:text-text-dark">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`${getColorClass()} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ModelDistributionItem;
