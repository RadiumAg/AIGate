'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModelDistributionItem {
  name: string;
  value: number;
  requests: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  requests: number;
  tokenValue?: number;
}

interface ModelDistributionChartProps {
  data: ModelDistributionItem[];
  loading?: boolean;
}

type ChartMode = 'token' | 'request';

const ModelDistributionChart: React.FC<ModelDistributionChartProps> = (props) => {
  const { data, loading = false } = props;
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<ChartMode>('token');

  const initChart = React.useEffectEvent(() => {
    if (!chartRef.current || !data || data.length === 0 || loading) return;

    const chart = echarts.init(chartRef.current);

    // 根据 mode 计算总值和显示数据
    const totalValues = data.reduce((sum, item) => {
      return sum + (mode === 'token' ? item.value : item.requests);
    }, 0);

    // 配置图表
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: { data: ChartDataItem; name: string }) => {
          const item = params.data;
          const currentValue = mode === 'token' ? item.value : item.requests;
          const percentage = ((currentValue / totalValues) * 100).toFixed(1);
          return `
            <div style="font-weight: bold;">${item.name}</div>
            <div>请求次数：${item.requests} 次</div>
            <div>Token 消耗：${item.value.toLocaleString()} tokens</div>
            <div>占比：${percentage}%</div>
          `;
        },
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: mode === 'token' ? 'Token 消耗分布' : '请求次数分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside',
            formatter: (params: { value: number; data: ChartDataItem; name: string }) => {
              const currentValue = mode === 'token' ? params.value : params.data.requests;
              const percentage = ((currentValue / totalValues) * 100).toFixed(1);
              return `${params.name}: ${percentage}%`;
            },
          },
          labelLine: {
            show: true,
          },
          data: data.map((item) => ({
            name: item.name,
            value: mode === 'token' ? item.value : item.requests,
            requests: item.requests,
            tokenValue: item.value,
          })),
        },
      ],
    };

    chart.setOption(option);

    // 响应窗口大小变化
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  });

  React.useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [data, mode]);

  return (
    <div className="w-full">
      {/* Tabs 切换 */}
      <Tabs value={mode} onValueChange={(value) => setMode(value as ChartMode)} className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="token">Token 占比</TabsTrigger>
            <TabsTrigger value="request">请求次数占比</TabsTrigger>
          </TabsList>
        </div>

        {loading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">暂无模型使用数据</p>
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-64"></div>
        )}
      </Tabs>
    </div>
  );
};

export default ModelDistributionChart;
