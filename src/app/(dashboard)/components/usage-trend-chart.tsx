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

    // 先 dispose 已有实例，避免 SVG removeChild 冲突
    const existingInstance = echarts.getInstanceByDom(chartRef.current);
    if (existingInstance) {
      existingInstance.dispose();
    }

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
          // 系列颜色
          requestsColor: '#60a5fa',
          requestsYAxisColor: '#60a5fa',
          tokensColor: '#34d399',
          tokensYAxisColor: '#34d399',
          // 数据点边框
          itemBorderColor: '#1e1e24',
          // 阴影和渐变
          requestsShadow: 'rgba(96, 165, 250, 0.4)',
          requestsGradientStart: 'rgba(96, 165, 250, 0.3)',
          requestsGradientEnd: 'rgba(96, 165, 250, 0.05)',
          tokensShadow: 'rgba(52, 211, 153, 0.4)',
          tokensGradientStart: 'rgba(52, 211, 153, 0.3)',
          tokensGradientEnd: 'rgba(52, 211, 153, 0.05)',
        }
      : {
          backgroundColor: 'transparent',
          textColor: '#374151',
          axisColor: '#6b7280',
          gridColor: '#f3f4f6',
          tooltipBg: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e5e7eb',
          // 系列颜色
          requestsColor: '#3b82f6',
          requestsYAxisColor: '#1890ff',
          tokensColor: '#10b981',
          tokensYAxisColor: '#52c41a',
          // 数据点边框
          itemBorderColor: '#ffffff',
          // 阴影和渐变
          requestsShadow: 'rgba(59, 130, 246, 0.3)',
          requestsGradientStart: 'rgba(59, 130, 246, 0.2)',
          requestsGradientEnd: 'rgba(59, 130, 246, 0.02)',
          tokensShadow: 'rgba(16, 185, 129, 0.3)',
          tokensGradientStart: 'rgba(16, 185, 129, 0.2)',
          tokensGradientEnd: 'rgba(16, 185, 129, 0.02)',
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
            color: themeConfig.requestsYAxisColor,
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
            color: themeConfig.tokensYAxisColor,
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
            color: themeConfig.requestsColor,
            width: 3,
          },
          itemStyle: {
            color: themeConfig.requestsColor,
            borderColor: themeConfig.itemBorderColor,
            borderWidth: 2,
            shadowColor: themeConfig.requestsShadow,
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: themeConfig.requestsGradientStart,
              },
              {
                offset: 1,
                color: themeConfig.requestsGradientEnd,
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
            color: themeConfig.tokensColor,
            width: 3,
          },
          itemStyle: {
            color: themeConfig.tokensColor,
            borderColor: themeConfig.itemBorderColor,
            borderWidth: 2,
            shadowColor: themeConfig.tokensShadow,
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: themeConfig.tokensGradientStart,
              },
              {
                offset: 1,
                color: themeConfig.tokensGradientEnd,
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
  }, [data, loading, isDarkMode]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-72"></div>
      {!loading && data.length > 0 && (
        <div className="mt-3 text-center text-xs">
          数据周期：{new Date(data[0].date).toLocaleDateString('zh-CN')} -{' '}
          {new Date(data[data.length - 1].date).toLocaleDateString('zh-CN')}
        </div>
      )}
    </div>
  );
};

export default UsageTrendChart;
