'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';

const CHINA_MAP_GEOJSON_URL = '/100000_full.json';

interface RegionDistributionItem {
  name: string;
  value: number;
  tokens: number;
}

interface RegionHeatmapChartProps {
  data: RegionDistributionItem[];
  loading?: boolean;
}

const RegionHeatmapChart: React.FC<RegionHeatmapChartProps> = (props) => {
  const { data, loading = false } = props;
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapError, setMapError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const registerChinaMap = async () => {
      // 如果已注册过则跳过
      if (echarts.getMap('china')) {
        setMapReady(true);
        return;
      }

      try {
        const response = await fetch(CHINA_MAP_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }
        const geoJson = await response.json();
        if (!cancelled) {
          echarts.registerMap('china', geoJson);
          setMapReady(true);
        }
      } catch (error) {
        console.error('加载中国地图数据失败:', error);
        if (!cancelled) {
          setMapError(true);
        }
      }
    };

    registerChinaMap();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!chartRef.current || loading || !mapReady) return;

    const chart = echarts.init(chartRef.current);

    const maxValue = Math.max(...data.map((item) => item.value), 1);

    const mapData = data.map((item) => ({
      name: item.name,
      value: item.value,
      tokens: item.tokens,
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: ((params: unknown) => {
          const param = params as { name?: string; data?: RegionDistributionItem };
          const dataItem = param.data;
          if (!dataItem || dataItem.value === undefined) {
            return `<div style="font-weight: bold;">${param.name ?? ''}</div><div>暂无请求数据</div>`;
          }
          return `
            <div style="font-weight: bold;">${dataItem.name}</div>
            <div>请求次数: ${dataItem.value.toLocaleString()} 次</div>
            <div>Token 消耗: ${dataItem.tokens.toLocaleString()} tokens</div>
          `;
        }) as unknown as echarts.TooltipComponentOption['formatter'],
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        inRange: {
          color: ['#e0f3ff', '#7eb8f7', '#409eff', '#1d6ce0', '#0d47a1'],
        },
        textStyle: {
          color: '#666',
        },
        left: 'left',
        bottom: 10,
        text: ['高', '低'],
      },
      series: [
        {
          name: '请求地区分布',
          type: 'map',
          map: 'china',
          roam: true,
          zoom: 1.2,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              color: '#333',
              fontSize: 12,
            },
            itemStyle: {
              areaColor: '#ffd666',
            },
          },
          itemStyle: {
            areaColor: '#e7e8ea',
            borderColor: '#acb5c1',
            borderWidth: 0.5,
          },
          data: mapData,
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
  }, [data, loading, mapReady]);

  if (loading || (!mapReady && !mapError)) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">地图数据加载失败</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">暂无地区分布数据</p>
      </div>
    );
  }

  return <div ref={chartRef} className="w-full h-80"></div>;
};

export default RegionHeatmapChart;
