'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';

interface UsageTrendChartProps {
  data: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
  loading: boolean;
}

const UsageTrendChart: React.FC<UsageTrendChartProps> = (props) => {
  const { data, loading } = props;
  const chartRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!chartRef.current || loading || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
        },
        padding: [10, 15],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
      },
      legend: {
        data: ['请求数', 'Token 消耗'],
        textStyle: {
          color: '#4b5563',
          fontSize: 12,
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 20,
        right: 20,
        top: 0,
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '15%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((item) =>
          new Date(item.date).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })
        ),
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          rotate: 0,
          margin: 12,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '请求数（次）',
          position: 'left',
          nameTextStyle: {
            color: '#1890ff',
            fontSize: 12,
            fontWeight: '500',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#e5e7eb',
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 11,
            formatter: '{value}',
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f3f4f6',
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Token（个）',
          position: 'right',
          nameTextStyle: {
            color: '#52c41a',
            fontSize: 12,
            fontWeight: '500',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#e5e7eb',
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 11,
            formatter: (value: number) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`;
              }
              return value.toString();
            },
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: '请求数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: '#3b82f6',
            width: 3,
          },
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowColor: 'rgba(59, 130, 246, 0.3)',
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(59, 130, 246, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(59, 130, 246, 0.02)',
              },
            ]),
          },
          data: data.map((item) => item.requests),
          yAxisIndex: 0,
        },
        {
          name: 'Token 消耗',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: '#10b981',
            width: 3,
          },
          itemStyle: {
            color: '#10b981',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowColor: 'rgba(16, 185, 129, 0.3)',
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(16, 185, 129, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(16, 185, 129, 0.02)',
              },
            ]),
          },
          data: data.map((item) => item.tokens),
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
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div ref={chartRef} className="w-full h-64"></div>
      <div className="mt-3 text-center text-xs text-gray-500">
        数据周期：{data.length > 0 && new Date(data[0].date).toLocaleDateString('zh-CN')} -{' '}
        {data.length > 0 && new Date(data[data.length - 1].date).toLocaleDateString('zh-CN')}
      </div>
    </div>
  );
};

export default UsageTrendChart;
