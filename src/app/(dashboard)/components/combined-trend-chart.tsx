'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/i18n/client';

interface CombinedTrendChartProps {
  data: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  loading: boolean;
}

const CombinedTrendChart: React.FC<CombinedTrendChartProps> = (props) => {
  const { data, loading } = props;
  const { t, locale } = useTranslation();
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
          tokensColor: '#34d399',
          costColor: '#fbbf24',
          // Y轴颜色
          requestsYAxisColor: '#60a5fa',
          tokensYAxisColor: '#34d399',
          costYAxisColor: '#fbbf24',
          // 数据点边框
          itemBorderColor: '#1e1e24',
          // 阴影和渐变
          requestsShadow: 'rgba(96, 165, 250, 0.4)',
          requestsGradientStart: 'rgba(96, 165, 250, 0.3)',
          requestsGradientEnd: 'rgba(96, 165, 250, 0.05)',
          tokensShadow: 'rgba(52, 211, 153, 0.4)',
          tokensGradientStart: 'rgba(52, 211, 153, 0.3)',
          tokensGradientEnd: 'rgba(52, 211, 153, 0.05)',
          costShadow: 'rgba(251, 191, 36, 0.4)',
          costGradientStart: 'rgba(251, 191, 36, 0.3)',
          costGradientEnd: 'rgba(251, 191, 36, 0.05)',
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
          tokensColor: '#10b981',
          costColor: '#f59e0b',
          // Y轴颜色
          requestsYAxisColor: '#1890ff',
          tokensYAxisColor: '#52c41a',
          costYAxisColor: '#d97706',
          // 数据点边框
          itemBorderColor: '#ffffff',
          // 阴影和渐变
          requestsShadow: 'rgba(59, 130, 246, 0.3)',
          requestsGradientStart: 'rgba(59, 130, 246, 0.2)',
          requestsGradientEnd: 'rgba(59, 130, 246, 0.02)',
          tokensShadow: 'rgba(16, 185, 129, 0.3)',
          tokensGradientStart: 'rgba(16, 185, 129, 0.2)',
          tokensGradientEnd: 'rgba(16, 185, 129, 0.02)',
          costShadow: 'rgba(245, 158, 11, 0.3)',
          costGradientStart: 'rgba(245, 158, 11, 0.2)',
          costGradientEnd: 'rgba(245, 158, 11, 0.02)',
        };

    const requestsLabel = t('Dashboard.requests') as string;
    const tokensLabel = t('Dashboard.tokenUsage') as string;
    const costLabel = t('Dashboard.cost') as string;

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
        formatter: (
          params: { axisValue: string; seriesName: string; value: number; color: string }[]
        ) => {
          const date = params[0].axisValue;
          let tooltipContent = `<div style="font-weight: 500; margin-bottom: 4px;">${date}</div>`;

          params.forEach((param) => {
            const value =
              param.seriesName === costLabel
                ? `$${param.value.toFixed(4)}`
                : param.value.toLocaleString();
            const unit =
              param.seriesName === requestsLabel
                ? ' 次'
                : param.seriesName === tokensLabel
                  ? ' tokens'
                  : '';
            tooltipContent += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${param.color}; margin-right: 6px;"></span>
              <span>${param.seriesName}: ${value}${unit}</span>
            </div>`;
          });

          return tooltipContent;
        },
      },
      legend: {
        data: [requestsLabel, tokensLabel, costLabel],
        textStyle: {
          color: themeConfig.textColor,
          fontSize: 12,
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        right: 20,
        top: 0,
      },
      grid: {
        left: '6%',
        right: '6%',
        bottom: '15%',
        top: '22%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: data.map((item) =>
          new Date(item.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
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
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: requestsLabel,
          position: 'left',
          nameTextStyle: {
            color: themeConfig.requestsYAxisColor,
            fontSize: 11,
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
            fontSize: 10,
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
          name: tokensLabel,
          position: 'right',
          nameTextStyle: {
            color: themeConfig.tokensYAxisColor,
            fontSize: 11,
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
            fontSize: 10,
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
        {
          type: 'value',
          name: costLabel,
          position: 'right',
          offset: 60,
          nameTextStyle: {
            color: themeConfig.costYAxisColor,
            fontSize: 11,
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
            fontSize: 10,
            formatter: (value: number) => `$${value.toFixed(2)}`,
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: requestsLabel,
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeConfig.requestsColor },
              { offset: 1, color: themeConfig.requestsGradientEnd },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: themeConfig.requestsColor },
                { offset: 1, color: themeConfig.requestsGradientEnd },
              ]),
            },
          },
          data: data.map((item) => item.requests),
          yAxisIndex: 0,
        },
        {
          name: tokensLabel,
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeConfig.tokensColor },
              { offset: 1, color: themeConfig.tokensGradientEnd },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: themeConfig.tokensColor },
                { offset: 1, color: themeConfig.tokensGradientEnd },
              ]),
            },
          },
          data: data.map((item) => item.tokens),
          yAxisIndex: 1,
        },
        {
          name: costLabel,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: themeConfig.costColor,
            width: 2.5,
          },
          itemStyle: {
            color: themeConfig.costColor,
            borderColor: themeConfig.itemBorderColor,
            borderWidth: 2,
          },
          data: data.map((item) => item.cost),
          yAxisIndex: 2,
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
  }, [data, loading, isDarkMode, t, locale]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-72"></div>
      {!loading && data.length > 0 && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          {t('Dashboard.dataPeriod') as string}：
          {new Date(data[0].date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')} -{' '}
          {new Date(data[data.length - 1].date).toLocaleDateString(
            locale === 'zh' ? 'zh-CN' : 'en-US'
          )}
        </div>
      )}
    </div>
  );
};

export default CombinedTrendChart;
