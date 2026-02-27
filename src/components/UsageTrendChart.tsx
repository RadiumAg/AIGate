'use client';

import React, { FC } from 'react';
import * as echarts from 'echarts';

interface UsageTrendChartProps {
  data: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
  loading: boolean;
}

const UsageTrendChart: FC<UsageTrendChartProps> = ({ data, loading }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!chartRef.current || loading || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: {
          color: '#fff',
        },
      },
      legend: {
        data: ['请求数', 'Token 消耗'],
        textStyle: {
          color: '#666',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(item => 
          new Date(item.date).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })
        ),
        axisLine: {
          lineStyle: {
            color: '#ddd',
          },
        },
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '请求数',
          position: 'left',
          axisLine: {
            lineStyle: {
              color: '#1890ff',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
        {
          type: 'value',
          name: 'Token',
          position: 'right',
          axisLine: {
            lineStyle: {
              color: '#52c41a',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      series: [
        {
          name: '请求数',
          type: 'line',
          smooth: true,
          data: data.map(item => item.requests),
          lineStyle: {
            color: '#1890ff',
          },
          itemStyle: {
            color: '#1890ff',
          },
          yAxisIndex: 0,
        },
        {
          name: 'Token 消耗',
          type: 'line',
          smooth: true,
          data: data.map(item => item.tokens),
          lineStyle: {
            color: '#52c41a',
          },
          itemStyle: {
            color: '#52c41a',
          },
          yAxisIndex: 1,
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, loading]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="w-full h-64"></div>
  );
};

export default UsageTrendChart;