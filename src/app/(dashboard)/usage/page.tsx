'use client';

import React from 'react';
import UsageChart from './components/UsageChart';
import UserList from './components/UserList';
import ModelDistributionItem from './components/ModelDistributionItem';
import QuotaOverviewItem from './components/QuotaOverviewItem';

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
  const [timeRange, setTimeRange] = React.useState<'day' | 'week' | 'month'>('week');

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
