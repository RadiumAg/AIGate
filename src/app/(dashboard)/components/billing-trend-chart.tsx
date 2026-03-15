'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';

interface BillingTrendChartProps {
  data: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
  loading: boolean;
}

const BillingTrendChart: React.FC<BillingTrendChartProps> = (props) => {
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
          costColor: '#fbbf24',
          costYAxisColor: '#fbbf24',
          tokensColor: '#60a5fa',
          tokensYAxisColor: '#60a5fa',
          // 数据点边框
          itemBorderColor: '#1e1e24',
          // 阴影和渐变
          costShadow: 'rgba(251, 191, 36, 0.4)',
          costGradientStart: 'rgba(251, 191, 36, 0.3)',
          costGradientEnd: 'rgba(251, 191, 36, 0.05)',
          tokensShadow: 'rgba(96, 165, 250, 0.4)',
          tokensGradientStart: 'rgba(96, 165, 250, 0.3)',
          tokensGradientEnd: 'rgba(96, 165, 250, 0.05)',
        }
      : {
          backgroundColor: 'transparent',
          textColor: '#374151',
          axisColor: '#6b7280',
          gridColor: '#f3f4f6',
          tooltipBg: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e5e7eb',
          // 系列颜色
          costColor: '#f59e0b',
          costYAxisColor: '#d97706',
          tokensColor: '#3b82f6',
          tokensYAxisColor: '#1890ff',
          // 数据点边框
          itemBorderColor: '#ffffff',
          // 阴影和渐变
          costShadow: 'rgba(245, 158, 11, 0.3)',
          costGradientStart: 'rgba(245, 158, 11, 0.2)',
          costGradientEnd: 'rgba(245, 158, 11, 0.02)',
          tokensShadow: 'rgba(59, 130, 246, 0.3)',
          tokensGradientStart: 'rgba(59, 130, 246, 0.2)',
          tokensGradientEnd: 'rgba(59, 130, 246, 0.02)',
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
        formatter: (params: any[]) => {
          const date = params[0].axisValue;
          let tooltipContent = `<div style="font-weight: 500; margin-bottom: 4px;">${date}</div>`;

          params.forEach((param) => {
            if (param.seriesName === '费用') {
              tooltipContent += `<div style="display: flex; align-items: center; margin: 2px 0;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${param.color}; margin-right: 6px;"></span>
                <span>${param.seriesName}: $${param.value.toFixed(4)}</span>
              </div>`;
            } else {
              tooltipContent += `<div style="display: flex; align-items: center; margin: 2px 0;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${param.color}; margin-right: 6px;"></span>
                <span>${param.seriesName}: ${param.value.toLocaleString()} tokens</span>
              </div>`;
            }
          });

          return tooltipContent;
        },
      },
      legend: {
        data: ['费用', 'Token 消耗'],
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
          name: '费用 ($)',
          position: 'left',
          nameTextStyle: {
            color: themeConfig.costYAxisColor,
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
              return `$${value.toFixed(4)}`;
            },
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
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
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
          name: '费用',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: themeConfig.costColor,
            width: 3,
          },
          itemStyle: {
            color: themeConfig.costColor,
            borderColor: themeConfig.itemBorderColor,
            borderWidth: 2,
            shadowColor: themeConfig.costShadow,
            shadowBlur: 6,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: themeConfig.costGradientStart,
              },
              {
                offset: 1,
                color: themeConfig.costGradientEnd,
              },
            ]),
          },
          data: data.map((item) => item.cost),
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

export default BillingTrendChart;
