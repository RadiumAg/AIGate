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

  // 获取系统主题偏好
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  React.useEffect(() => {
    if (!chartRef.current || loading || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current);

    // 根据主题设置颜色配置
    const themeConfig = isDarkMode
      ? {
          backgroundColor: 'transparent',
          textColor: '#e5e7eb',
          axisColor: '#4b5563',
          gridColor: '#374151',
          tooltipBg: 'rgba(30, 30, 36, 0.95)',
          borderColor: '#4b5563',
        }
      : {
          backgroundColor: 'transparent',
          textColor: '#374151',
          axisColor: '#6b7280',
          gridColor: '#f3f4f6',
          tooltipBg: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e5e7eb',
        };

    const option = {
      backgroundColor: themeConfig.backgroundColor,
      tooltip: {
        trigger: 'axis',
        backgroundColor: themeConfig.tooltipBg,
        borderColor: themeConfig.borderColor,
        borderWidth: 1,
        textStyle: {
          color: themeConfig.textColor,
          fontSize: 12,
        },
        padding: [10, 15],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
      },
      legend: {
        data: ['请求数', 'Token 消耗'],
        textStyle: {
          color: themeConfig.textColor,
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
            color: themeConfig.axisColor,
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: themeConfig.textColor,
          fontSize: 11,
          rotate: 0,
          margin: 12,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: themeConfig.gridColor,
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
            color: isDarkMode ? '#60a5fa' : '#1890ff',
            fontSize: 12,
            fontWeight: '500',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: themeConfig.axisColor,
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: themeConfig.textColor,
            fontSize: 11,
            formatter: '{value}',
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: themeConfig.gridColor,
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Token（个）',
          position: 'right',
          nameTextStyle: {
            color: isDarkMode ? '#34d399' : '#52c41a',
            fontSize: 12,
            fontWeight: '500',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: themeConfig.axisColor,
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: themeConfig.textColor,
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
            color: isDarkMode ? '#60a5fa' : '#3b82f6',
            width: 3,
          },
          itemStyle: {
            color: isDarkMode ? '#60a5fa' : '#3b82f6',
            borderColor: isDarkMode ? '#1e1e24' : '#ffffff',
            borderWidth: 2,
            shadowColor: isDarkMode ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)',
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)',
              },
              {
                offset: 1,
                color: isDarkMode ? 'rgba(96, 165, 250, 0.05)' : 'rgba(59, 130, 246, 0.02)',
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
            color: isDarkMode ? '#34d399' : '#10b981',
            width: 3,
          },
          itemStyle: {
            color: isDarkMode ? '#34d399' : '#10b981',
            borderColor: isDarkMode ? '#1e1e24' : '#ffffff',
            borderWidth: 2,
            shadowColor: isDarkMode ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.3)',
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: isDarkMode ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.2)',
              },
              {
                offset: 1,
                color: isDarkMode ? 'rgba(52, 211, 153, 0.05)' : 'rgba(16, 185, 129, 0.02)',
              },
            ]),
          },
          data: data.map((item) => item.tokens),
          yAxisIndex: 1,
        },
      ],
    };

    chart.setOption(option);

    // 监听主题变化
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      chart.setOption(option);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, loading, isDarkMode]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div ref={chartRef} className="w-full h-72"></div>
      <div className={`mt-3 text-center text-xs`}>
        数据周期：{data.length > 0 && new Date(data[0].date).toLocaleDateString('zh-CN')} -{' '}
        {data.length > 0 && new Date(data[data.length - 1].date).toLocaleDateString('zh-CN')}
      </div>
    </div>
  );
};

export default UsageTrendChart;
