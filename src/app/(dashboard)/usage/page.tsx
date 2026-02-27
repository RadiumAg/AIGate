'use client';

import { useState } from 'react';

interface UsageDataPoint {
  date: string;
  tokens: number;
  requests: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  tokensUsed: number;
  requests: number;
  status: 'active' | 'inactive';
}

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Mock data for usage chart
  const usageData: UsageDataPoint[] = [
    { date: '2024-02-01', tokens: 12000, requests: 450 },
    { date: '2024-02-02', tokens: 15000, requests: 520 },
    { date: '2024-02-03', tokens: 8000, requests: 300 },
    { date: '2024-02-04', tokens: 22000, requests: 780 },
    { date: '2024-02-05', tokens: 18000, requests: 650 },
    { date: '2024-02-06', tokens: 25000, requests: 920 },
    { date: '2024-02-07', tokens: 19000, requests: 700 },
  ];

  // Mock data for users
  const userData: UserData[] = [
    {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      tokensUsed: 45000,
      requests: 1200,
      status: 'active',
    },
    {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      tokensUsed: 32000,
      requests: 890,
      status: 'active',
    },
    {
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      tokensUsed: 28000,
      requests: 750,
      status: 'active',
    },
    {
      id: '4',
      name: '赵六',
      email: 'zhaoliu@example.com',
      tokensUsed: 15000,
      requests: 420,
      status: 'inactive',
    },
    {
      id: '5',
      name: '钱七',
      email: 'qianqi@example.com',
      tokensUsed: 8000,
      requests: 230,
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-text-dark">用量统计</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              timeRange === 'day'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            今天
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              timeRange === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              timeRange === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            本月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <UsageChart data={usageData} timeRange={timeRange} />
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-text-dark">
            模型调用分布
          </h2>
          <div className="space-y-4">
            <ModelDistributionItem model="GPT-4 Turbo" percentage={45} color="primary" />
            <ModelDistributionItem model="Claude 3 Opus" percentage={25} color="warning" />
            <ModelDistributionItem model="Gemini Pro" percentage={15} color="success" />
            <ModelDistributionItem model="Other Models" percentage={15} color="gray" />
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-text-dark">
            配额使用概况
          </h2>
          <div className="space-y-4">
            <QuotaOverviewItem
              label="总 Token 消耗"
              value="137,000"
              limit="500,000"
              percentage={27}
            />
            <QuotaOverviewItem label="总请求数" value="3,990" limit="10,000" percentage={40} />
            <QuotaOverviewItem label="活跃用户数" value="42" limit="100" percentage={42} />
          </div>
        </div>
      </div>

      <UserList users={userData} />
    </div>
  );
}

interface ModelDistributionItemProps {
  model: string;
  percentage: number;
  color: string;
}

const ModelDistributionItem: React.FC<ModelDistributionItemProps> = (props) => {
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

interface UsageChartProps {
  data: UsageDataPoint[];
  timeRange: 'day' | 'week' | 'month';
}

const UsageChart: React.FC<UsageChartProps> = (props) => {
  const { data, timeRange } = props;
  // Format date based on time range
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

  // Process data for chart
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

interface UserListProps {
  users: UserData[];
}

const UserList: React.FC<UserListProps> = (props) => {
  const { users } = props;
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl shadow-card-light dark:shadow-card-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-text-dark">用户用量排行</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                用户
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Token 消耗
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                请求次数
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                状态
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-card-dark divide-y divide-gray-200 dark:divide-slate-700">
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                        {user.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-text-dark">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">#{index + 1}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-text-dark">
                  {formatNumber(user.tokensUsed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-text-dark">
                  {formatNumber(user.requests)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {user.status === 'active' ? '活跃' : '非活跃'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                    详情
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                    重置配额
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-text-dark">
            暂无用户数据
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">还没有用户使用您的服务</p>
        </div>
      )}
    </div>
  );
};
