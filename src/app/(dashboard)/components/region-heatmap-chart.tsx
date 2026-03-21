'use client';

import React from 'react';
import * as echarts from 'echarts';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/client';

const CHINA_MAP_GEOJSON_URL = '/100000_full.json';
const WORLD_MAP_GEOJSON_URL = '/world.json';

// 中国省份名称映射
const CHINA_PROVINCES = new Set([
  '北京',
  '天津',
  '河北',
  '山西',
  '内蒙古',
  '辽宁',
  '吉林',
  '黑龙江',
  '上海',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '重庆',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
  '台湾',
  '香港',
  '澳门',
]);

// 国家名称中英文映射
const COUNTRY_NAME_MAP: Record<string, string> = {
  中国: 'China',
  美国: 'United States',
  日本: 'Japan',
  韩国: 'South Korea',
  英国: 'United Kingdom',
  法国: 'France',
  德国: 'Germany',
  新加坡: 'Singapore',
  澳大利亚: 'Australia',
  加拿大: 'Canada',
  俄罗斯: 'Russia',
  印度: 'India',
  巴西: 'Brazil',
  意大利: 'Italy',
  西班牙: 'Spain',
  荷兰: 'Netherlands',
  瑞士: 'Switzerland',
  瑞典: 'Sweden',
  挪威: 'Norway',
  芬兰: 'Finland',
  丹麦: 'Denmark',
  波兰: 'Poland',
  比利时: 'Belgium',
  奥地利: 'Austria',
  爱尔兰: 'Ireland',
  葡萄牙: 'Portugal',
  捷克: 'Czech Republic',
  匈牙利: 'Hungary',
  希腊: 'Greece',
  土耳其: 'Turkey',
  以色列: 'Israel',
  阿联酋: 'United Arab Emirates',
  沙特阿拉伯: 'Saudi Arabia',
  南非: 'South Africa',
  墨西哥: 'Mexico',
  阿根廷: 'Argentina',
  智利: 'Chile',
  哥伦比亚: 'Colombia',
  秘鲁: 'Peru',
  委内瑞拉: 'Venezuela',
  泰国: 'Thailand',
  越南: 'Vietnam',
  马来西亚: 'Malaysia',
  印度尼西亚: 'Indonesia',
  菲律宾: 'Philippines',
  新西兰: 'New Zealand',
  巴基斯坦: 'Pakistan',
  孟加拉国: 'Bangladesh',
  埃及: 'Egypt',
  尼日利亚: 'Nigeria',
  肯尼亚: 'Kenya',
  摩洛哥: 'Morocco',
  乌克兰: 'Ukraine',
  罗马尼亚: 'Romania',
};

interface RegionDistributionItem {
  name: string;
  value: number;
  tokens: number;
}

interface RegionHeatmapChartProps {
  data: RegionDistributionItem[];
  loading?: boolean;
}

type MapType = 'china' | 'world';

const RegionHeatmapChart: React.FC<RegionHeatmapChartProps> = (props) => {
  const { data, loading = false } = props;
  const { t } = useTranslation();
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = React.useState<MapType>('china');
  // 记录哪些地图已加载
  const [loadedMaps, setLoadedMaps] = React.useState<Set<MapType>>(new Set());
  const [mapError, setMapError] = React.useState<MapType | null>(null);

  // 当前地图是否准备好
  const mapReady = loadedMaps.has(mapType);

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

  // 转换数据格式
  const getMapData = React.useCallback(() => {
    if (mapType === 'china') {
      // 中国地图：过滤出中国省份的数据
      return data
        .filter((item) => CHINA_PROVINCES.has(item.name))
        .map((item) => ({
          name: item.name,
          value: item.value,
          tokens: item.tokens,
        }));
    } else {
      // 世界地图：将中国各省份合并为中国，其他国家保持原样
      const worldData: Map<string, { value: number; tokens: number }> = new Map();

      data.forEach((item) => {
        if (CHINA_PROVINCES.has(item.name)) {
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
  }, [data, mapType]);

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
          <p className="text-gray-500 dark:text-gray-400">地图数据加载失败</p>
        </div>
      )}
      {!loading && mapError !== mapType && mapReady && (!data || data.length === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">暂无地区分布数据</p>
        </div>
      )}
      <div ref={chartRef} className="w-full h-80"></div>
    </div>
  );
};

export default RegionHeatmapChart;
