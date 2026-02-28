'use client';

import React from 'react';
import * as echarts from 'echarts';
import { useMemoizedFn } from 'ahooks';

interface ModelDistributionItem {
  name: string;
  value: number;
  requests: number;
}

interface ModelDistributionChartProps {
  data: ModelDistributionItem[];
  loading?: boolean;
}

const ModelDistributionChart: React.FC<ModelDistributionChartProps> = (props) => {
  const { data, loading = false } = props;
  const chartRef = React.useRef<HTMLDivElement>(null);

  const initChart = useMemoizedFn(() => {
    if (!chartRef.current || !data || data.length === 0 || loading) return;

    const chart = echarts.init(chartRef.current);

    // 计算总请求次数
    const totalRequests = data.reduce((sum, item) => sum + item.requests, 0);

    // 配置图表
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = params.data;
          const percentage = ((item.value / totalRequests) * 100).toFixed(1);
          return `
            <div style="font-weight: bold;">${item.name}</div>
            <div>请求次数: ${item.requests} 次</div>
            <div>Token 消耗: ${item.value.toLocaleString()} tokens</div>
            <div>占比: ${percentage}%</div>
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
          name: '模型使用分布',
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
            formatter: (params: any) => {
              const percentage = ((params.value / totalRequests) * 100).toFixed(1);
              return `${params.name}: ${percentage}%`;
            },
          },
          labelLine: {
            show: true,
          },
          data: data.map((item) => ({
            name: item.name,
            value: item.value,
            requests: item.requests,
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
  }, [initChart]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">暂无模型使用数据</p>
      </div>
    );
  }

  return <div ref={chartRef} className="w-full h-64"></div>;
};

export default ModelDistributionChart;
