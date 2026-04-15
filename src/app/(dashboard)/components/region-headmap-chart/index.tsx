'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/client';
import { useMemoizedFn } from 'ahooks';
import {
  RegionDistributionItem,
  CHINA_PROVINCES,
  normalizeProvinceName,
  COUNTRY_NAME_MAP,
  getLocalizedCountryName,
  CHINA_MAP_GEOJSON_URL,
  WORLD_MAP_GEOJSON_URL,
} from './utils';

interface RegionHeatmapChartProps {
  data: RegionDistributionItem[];
  loading?: boolean;
}

type MapType = 'china' | 'world';

const RegionHeatmapChart: React.FC<RegionHeatmapChartProps> = (props) => {
  const { data, loading = false } = props;
  const { t, locale } = useTranslation();
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = React.useState<MapType>('china');
  // 记录哪些地图已加载
  const [loadedMaps, setLoadedMaps] = React.useState<Set<MapType>>(new Set());
  const [mapError, setMapError] = React.useState<MapType | null>(null);
  // 当前地图是否准备好
  const mapReady = loadedMaps.has(mapType);

  // 转换数据格式
  const getMapData = useMemoizedFn(() => {
    if (mapType === 'china') {
      // 中国地图：过滤出中国省份的数据
      // 规范化只用于判断是否是中国省份，传给 ECharts 的名称保持原样
      return data
        .filter((item) => CHINA_PROVINCES.has(normalizeProvinceName(item.name)))
        .map((item) => ({
          name: item.name, // 保持原始名称（如"广东省"），与 GeoJSON 中的一致
          value: item.value,
          tokens: item.tokens,
        }));
    } else {
      // 世界地图：将中国各省份合并为中国，其他国家保持原样
      const worldData: Map<string, { value: number; tokens: number }> = new Map();

      data.forEach((item) => {
        if (CHINA_PROVINCES.has(normalizeProvinceName(item.name))) {
          // 中国省份合并为中国
          const existing = worldData.get('China') || { value: 0, tokens: 0 };
          worldData.set('China', {
            value: existing.value + item.value,
            tokens: existing.tokens + item.tokens,
          });
        } else {
          // 其他国家/地区
          const englishName = COUNTRY_NAME_MAP[item.name] || item.name;
          const existing = worldData.get(englishName) || { value: 0, tokens: 0 };
          worldData.set(englishName, {
            value: existing.value + item.value,
            tokens: existing.tokens + item.tokens,
          });
        }
      });

      return Array.from(worldData.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        tokens: data.tokens,
      }));
    }
  });

  React.useEffect(() => {
    if (!chartRef.current || loading || !mapReady) return;

    // 确保地图已在 echarts 中注册
    const mapName = mapType;
    if (!echarts.getMap(mapName)) {
      return;
    }

    // 先 dispose 已有实例，避免 SVG removeChild 冲突
    const existingInstance = echarts.getInstanceByDom(chartRef.current);
    if (existingInstance) {
      existingInstance.dispose();
    }

    const chart = echarts.init(chartRef.current);
    const mapData = getMapData();
    const maxValue = Math.max(...mapData.map((item) => item.value), 1);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: ((params: unknown) => {
          const param = params as {
            name?: string;
            data?: { name: string; value: number; tokens: number };
          };
          const dataItem = param.data;
          // 世界地图显示本地化国家名
          const displayName =
            mapType === 'world' && param.name
              ? getLocalizedCountryName(param.name, locale)
              : param.name;
          if (!dataItem || dataItem.value === undefined) {
            return `<div style="font-weight: bold;">${displayName ?? ''}</div><div>${t('Dashboard.noRequestData')}</div>`;
          }
          return `
            <div style="font-weight: bold;">${displayName}</div>
            <div>${t('Dashboard.requestCount')}: ${dataItem.value.toLocaleString()}</div>
            <div>${t('Dashboard.tokenConsumption')}: ${dataItem.tokens.toLocaleString()}</div>
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
        text: [t('Dashboard.high'), t('Dashboard.low')],
      },
      series: [
        {
          name: t('Dashboard.requestRegionDistribution'),
          type: 'map',
          map: mapName,
          roam: true,
          zoom: mapType === 'china' ? 1.2 : 1,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              color: '#333',
              fontSize: 12,
              formatter: (params: unknown) => {
                const param = params as { name?: string };
                if (mapType === 'world' && param.name) {
                  return getLocalizedCountryName(param.name, locale);
                }
                return param.name ?? '';
              },
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
  }, [data, loading, mapReady, mapType, getMapData]);

  // 加载地图数据
  React.useEffect(() => {
    let cancelled = false;

    const registerMap = async () => {
      const mapName = mapType;
      const mapUrl = mapType === 'china' ? CHINA_MAP_GEOJSON_URL : WORLD_MAP_GEOJSON_URL;

      // 如果已注册过则跳过
      if (echarts.getMap(mapName)) {
        setLoadedMaps((prev) => new Set(prev).add(mapType));
        return;
      }

      try {
        setMapError(null);
        const response = await fetch(mapUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }
        const geoJson = await response.json();
        if (!cancelled) {
          echarts.registerMap(mapName, geoJson);
          setLoadedMaps((prev) => new Set(prev).add(mapType));
        }
      } catch (error) {
        console.error(`加载${mapType === 'china' ? '中国' : '世界'}地图数据失败:`, error);
        if (!cancelled) {
          setMapError(mapType);
        }
      }
    };

    registerMap();

    return () => {
      cancelled = true;
    };
  }, [mapType]);

  return (
    <div className="relative">
      {/* 地图切换 Tabs */}
      <div className="flex justify-end mb-3">
        <Tabs value={mapType} onValueChange={(v) => setMapType(v as MapType)}>
          <TabsList className="h-8">
            <TabsTrigger value="china" className="text-xs px-3 h-7">
              {t('Dashboard.chinaMap') as string}
            </TabsTrigger>
            <TabsTrigger value="world" className="text-xs px-3 h-7">
              {t('Dashboard.worldMap') as string}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {(loading || (!mapReady && !mapError)) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      )}
      {mapError === mapType && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">{t('Dashboard.mapLoadError')}</p>
        </div>
      )}
      {!loading && mapError !== mapType && mapReady && (!data || data.length === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">{t('Dashboard.noRegionData')}</p>
        </div>
      )}
      <div ref={chartRef} className="w-full h-80"></div>
    </div>
  );
};

export default RegionHeatmapChart;
