export const CHINA_MAP_GEOJSON_URL = '/100000_full.json';
export const WORLD_MAP_GEOJSON_URL = '/world.json';
// 中国省份名称映射
export const CHINA_PROVINCES = new Set([
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
/**
 * 规范化省份名称，去掉省、市、自治区、特别行政区等后缀
 */
export function normalizeProvinceName(name: string): string {
  return name
    .replace(/省$/, '')
    .replace(/市$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '');
}
// 国家名称中英文映射
export const COUNTRY_NAME_MAP: Record<string, string> = {
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
export interface RegionDistributionItem {
  name: string;
  value: number;
  tokens: number;
}
