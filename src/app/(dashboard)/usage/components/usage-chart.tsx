'use client';

import { FC } from 'react';

interface UsageDataPoint {
  date: string;
  tokens: number;
  requests: number;
}

interface UsageChartProps {
  data: UsageDataPoint[];
  timeRange: 'day' | 'week' | 'month';
}

const UsageChart: FC<UsageChartProps> = (props) => {
  const { data, timeRange } = props;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    switch (timeRange) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short' });
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return dateString;
    }
  };

  const processedData = data.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-text-dark">
        Token 消耗趋势
      </h2>
      <div className="h-80">
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">此处应显示图表，但由于依赖问题暂未实现</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-text-dark">请求分布</h3>
        <div className="h-64">
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              此处应显示柱状图，但由于依赖问题暂未实现
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageChart;
