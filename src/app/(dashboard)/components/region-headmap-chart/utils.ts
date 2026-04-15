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
  韩国: 'Korea',
  朝鲜: 'Dem. Rep. Korea',
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

// 州/省份到国家的映射（世界地图只显示国家级别）
export const PROVINCE_TO_COUNTRY_MAP: Record<string, string> = {
  // 美国各州
  加利福尼亚: 'United States',
  California: 'United States',
  纽约: 'United States',
  'New York': 'United States',
  得克萨斯: 'United States',
  Texas: 'United States',
  佛罗里达: 'United States',
  Florida: 'United States',
  华盛顿: 'United States',
  Washington: 'United States',
  马萨诸塞: 'United States',
  Massachusetts: 'United States',
  伊利诺伊: 'United States',
  Illinois: 'United States',
  宾夕法尼亚: 'United States',
  Pennsylvania: 'United States',
  俄亥俄: 'United States',
  Ohio: 'United States',
  乔治亚: 'United States',
  Georgia: 'United States',
  密歇根: 'United States',
  Michigan: 'United States',
  新泽西: 'United States',
  'New Jersey': 'United States',
  弗吉尼亚: 'United States',
  Virginia: 'United States',
  亚利桑那: 'United States',
  Arizona: 'United States',
  科罗拉多: 'United States',
  Colorado: 'United States',
  俄勒冈: 'United States',
  Oregon: 'United States',
  内华达: 'United States',
  Nevada: 'United States',
  北卡罗来纳: 'United States',
  'North Carolina': 'United States',
  南卡罗来纳: 'United States',
  'South Carolina': 'United States',
  田纳西: 'United States',
  Tennessee: 'United States',
  印第安纳: 'United States',
  Indiana: 'United States',
  马里兰: 'United States',
  Maryland: 'United States',
  威斯康星: 'United States',
  Wisconsin: 'United States',
  明尼苏达: 'United States',
  Minnesota: 'United States',
  密苏里: 'United States',
  Missouri: 'United States',
  阿拉巴马: 'United States',
  Alabama: 'United States',
  路易斯安那: 'United States',
  Louisiana: 'United States',
  肯塔基: 'United States',
  Kentucky: 'United States',
  俄克拉荷马: 'United States',
  Oklahoma: 'United States',
  康涅狄格: 'United States',
  Connecticut: 'United States',
  犹他: 'United States',
  Utah: 'United States',
  新墨西哥: 'United States',
  'New Mexico': 'United States',
  阿肯色: 'United States',
  Arkansas: 'United States',
  密西西比: 'United States',
  Mississippi: 'United States',
  艾奥瓦: 'United States',
  Iowa: 'United States',
  堪萨斯: 'United States',
  Kansas: 'United States',
  夏威夷: 'United States',
  Hawaii: 'United States',
  阿拉斯加: 'United States',
  Alaska: 'United States',

  // 日本各都道府县
  东京: 'Japan',
  Tokyo: 'Japan',
  大阪: 'Japan',
  Osaka: 'Japan',
  京都: 'Japan',
  Kyoto: 'Japan',
  横滨: 'Japan',
  Yokohama: 'Japan',
  名古屋: 'Japan',
  Nagoya: 'Japan',
  神户: 'Japan',
  Kobe: 'Japan',
  福冈: 'Japan',
  Fukuoka: 'Japan',
  札幌: 'Japan',
  Sapporo: 'Japan',
  北海道: 'Japan',
  Hokkaido: 'Japan',

  // 英国各地区
  伦敦: 'United Kingdom',
  London: 'United Kingdom',
  曼彻斯特: 'United Kingdom',
  Manchester: 'United Kingdom',
  苏格兰: 'United Kingdom',
  Scotland: 'United Kingdom',
  威尔士: 'United Kingdom',
  Wales: 'United Kingdom',

  // 德国各州
  柏林: 'Germany',
  Berlin: 'Germany',
  慕尼黑: 'Germany',
  Munich: 'Germany',
  法兰克福: 'Germany',
  Frankfurt: 'Germany',
  汉堡: 'Germany',
  Hamburg: 'Germany',

  // 法国各大区
  巴黎: 'France',
  Paris: 'France',
  里昂: 'France',
  Lyon: 'France',
  马赛: 'France',
  Marseille: 'France',

  // 加拿大各省
  安大略: 'Canada',
  Ontario: 'Canada',
  魁北克: 'Canada',
  Quebec: 'Canada',
  不列颠哥伦比亚: 'Canada',
  'British Columbia': 'Canada',
  艾伯塔: 'Canada',
  Alberta: 'Canada',

  // 澳大利亚各州
  新南威尔士: 'Australia',
  'New South Wales': 'Australia',
  维多利亚: 'Australia',
  Victoria: 'Australia',
  昆士兰: 'Australia',
  Queensland: 'Australia',
  悉尼: 'Australia',
  Sydney: 'Australia',
  墨尔本: 'Australia',
  Melbourne: 'Australia',

  // 韩国各道
  首尔: 'Korea',
  Seoul: 'Korea',
  釜山: 'Korea',
  Busan: 'Korea',
  仁川: 'Korea',
  Incheon: 'Korea',

  // 印度各邦
  德里: 'India',
  Delhi: 'India',
  孟买: 'India',
  Mumbai: 'India',
  班加罗尔: 'India',
  Bangalore: 'India',
  加尔各答: 'India',
  Kolkata: 'India',

  // 巴西各州
  圣保罗: 'Brazil',
  'São Paulo': 'Brazil',
  'Sao Paulo': 'Brazil',
  里约热内卢: 'Brazil',
  'Rio de Janeiro': 'Brazil',
};

/**
 * 将地区名称转换为国家级别名称
 * 用于世界地图显示（世界地图只显示国家级别）
 */
export function normalizeToWorldMapRegion(regionName: string): string {
  // 先检查是否是中国省份
  if (CHINA_PROVINCES.has(normalizeProvinceName(regionName))) {
    return 'China';
  }
  // 检查是否在省份->国家映射中
  if (PROVINCE_TO_COUNTRY_MAP[regionName]) {
    return PROVINCE_TO_COUNTRY_MAP[regionName];
  }
  // 检查是否是国家名称
  if (COUNTRY_NAME_MAP[regionName]) {
    return COUNTRY_NAME_MAP[regionName];
  }
  // 返回原名
  return regionName;
}

// 反向映射：英文 -> 中文
export const COUNTRY_NAME_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_MAP).map(([zh, en]) => [en, zh])
);

// 根据英文国家名获取本地化名称
export function getLocalizedCountryName(englishName: string, locale: string): string {
  if (locale === 'zh') {
    return COUNTRY_NAME_REVERSE_MAP[englishName] || englishName;
  }
  return englishName;
}
export interface RegionDistributionItem {
  name: string;
  value: number;
  tokens: number;
}
