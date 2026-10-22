export type BuildCulture = 'vietnam' | 'australia';

export type HouseModel =
  | { family: 'tube'; floors: 2 | 3; width: number; depth: number; wall: string }
  | { family: 'village'; width: number; depth: number; wall: string; tile: string; palms: boolean }
  | { family: 'villa' }
  | { family: 'cottage'; wall: string; yard: boolean }
  | { family: 'raised'; width: number; depth: number };

export interface BuildTypeDefinition {
  culture: BuildCulture;
  name: readonly [string, string];
  icon?: string;
  model: HouseModel;
}

export const VIETNAMESE_HOUSE_TYPES = {
  tube: { culture: 'vietnam', name: ['Tube house (Vietnam)', 'Nhà ống'], icon: '🏠', model: { family: 'tube', floors: 3, width: 4.4, depth: 9, wall: '#9fd8c8' } },
  tube2: { culture: 'vietnam', name: ['Small tube house', 'Nhà ống nhỏ'], icon: '🏠', model: { family: 'tube', floors: 2, width: 4.4, depth: 9, wall: '#ffb3a0' } },
  village: { culture: 'vietnam', name: ['Village house with tiled roof', 'Nhà ngói ở làng'], icon: '🏡', model: { family: 'village', width: 9, depth: 5.5, wall: '#efe0bf', tile: '#b9553a', palms: true } },
  villa: { culture: 'vietnam', name: ['French villa', 'Biệt thự Pháp'], icon: '🏛️', model: { family: 'villa' } },
  vn_courtyard: { culture: 'vietnam', name: ['Vietnamese courtyard house', 'Nhà sân trong'], model: { family: 'village', width: 10, depth: 7, wall: '#ead7b1', tile: '#ad4936', palms: false } },
  vn_garden: { culture: 'vietnam', name: ['Vietnamese garden house', 'Nhà vườn Việt Nam'], model: { family: 'village', width: 9.5, depth: 7.5, wall: '#eadab8', tile: '#ba5d3d', palms: true } },
  vn_hoi_an: { culture: 'vietnam', name: ['Hoi An shophouse', 'Nhà phố Hội An'], model: { family: 'tube', floors: 2, width: 5, depth: 7, wall: '#e6be65' } },
  vn_hue_ruong: { culture: 'vietnam', name: ['Hue ruong house', 'Nhà rường Huế'], model: { family: 'village', width: 8.5, depth: 6.5, wall: '#d7c6a2', tile: '#a94a32', palms: false } },
  vn_mekong_stilt: { culture: 'vietnam', name: ['Mekong stilt house', 'Nhà sàn miền Tây'], model: { family: 'raised', width: 8, depth: 7.5 } },
  vn_riverside: { culture: 'vietnam', name: ['Vietnamese riverside home', 'Nhà ven sông Việt Nam'], model: { family: 'village', width: 8, depth: 6, wall: '#d9dfc0', tile: '#b34d39', palms: true } },
  vn_single_storey: { culture: 'vietnam', name: ['Vietnamese single-storey home', 'Nhà cấp bốn'], model: { family: 'village', width: 7.5, depth: 5.5, wall: '#e7d4ab', tile: '#bd5d3e', palms: false } },
  vn_shop_house: { culture: 'vietnam', name: ['Vietnamese shop house', 'Nhà phố buôn bán'], model: { family: 'tube', floors: 3, width: 4.2, depth: 10, wall: '#b7d8bd' } },
  vn_thai_roof: { culture: 'vietnam', name: ['Thai-roof home', 'Nhà mái Thái'], model: { family: 'village', width: 9.5, depth: 6.5, wall: '#f0d7a2', tile: '#b84634', palms: false } },
  vn_townhouse: { culture: 'vietnam', name: ['Vietnamese townhouse', 'Nhà liền kề Việt Nam'], model: { family: 'tube', floors: 2, width: 5, depth: 8, wall: '#c2d8cf' } },
  vn_urban_villa: { culture: 'vietnam', name: ['Vietnamese city villa', 'Biệt thự phố Việt Nam'], model: { family: 'villa' } },
} satisfies Record<string, BuildTypeDefinition>;

export const AUSTRALIAN_HOUSE_TYPES = {
  cottage: { culture: 'australia', name: ['Australian cottage', 'Nhà gỗ kiểu Úc'], icon: '🏘️', model: { family: 'cottage', wall: '#cfe6ee', yard: true } },
  raised: { culture: 'australia', name: ['Queenslander on stilts', 'Nhà sàn kiểu Queensland'], icon: '🛖', model: { family: 'raised', width: 7.5, depth: 7 } },
  au_bungalow: { culture: 'australia', name: ['Australian bungalow', 'Nhà bungalow kiểu Úc'], model: { family: 'cottage', wall: '#d5c1a1', yard: false } },
  au_brick_veneer: { culture: 'australia', name: ['Brick-veneer home', 'Nhà ốp gạch kiểu Úc'], model: { family: 'cottage', wall: '#c87963', yard: false } },
  au_coastal: { culture: 'australia', name: ['Australian coastal home', 'Nhà ven biển kiểu Úc'], model: { family: 'cottage', wall: '#b8d9df', yard: true } },
  au_country: { culture: 'australia', name: ['Australian country home', 'Nhà miền quê Úc'], model: { family: 'cottage', wall: '#e3d4b5', yard: true } },
  au_federation: { culture: 'australia', name: ['Federation-style home', 'Nhà phong cách Federation'], model: { family: 'cottage', wall: '#d3b89a', yard: true } },
  au_mid_century: { culture: 'australia', name: ['Mid-century home', 'Nhà phong cách giữa thế kỷ'], model: { family: 'tube', floors: 2, width: 7, depth: 8, wall: '#d9c9a7' } },
  au_modern: { culture: 'australia', name: ['Modern Australian home', 'Nhà hiện đại kiểu Úc'], model: { family: 'tube', floors: 2, width: 6.5, depth: 8, wall: '#d7e0df' } },
  au_queenslander: { culture: 'australia', name: ['Queenslander home', 'Nhà Queenslander'], model: { family: 'raised', width: 8.5, depth: 8 } },
  au_ranch: { culture: 'australia', name: ['Australian ranch home', 'Nhà trang trại kiểu Úc'], model: { family: 'cottage', wall: '#d2c1a0', yard: true } },
  au_stilt: { culture: 'australia', name: ['Australian stilt home', 'Nhà sàn kiểu Úc'], model: { family: 'raised', width: 7, depth: 8 } },
  au_terrace: { culture: 'australia', name: ['Australian terrace house', 'Nhà liền kề kiểu Úc'], model: { family: 'tube', floors: 2, width: 5, depth: 7.5, wall: '#dfc4b1' } },
  au_weatherboard: { culture: 'australia', name: ['Weatherboard home', 'Nhà ván gỗ kiểu Úc'], model: { family: 'cottage', wall: '#c9dce5', yard: true } },
  au_workers_cottage: { culture: 'australia', name: ['Workers’ cottage', 'Nhà công nhân kiểu Úc'], model: { family: 'cottage', wall: '#d8c9a6', yard: false } },
} satisfies Record<string, BuildTypeDefinition>;

export const BUILD_TYPE_CATALOG = {
  ...VIETNAMESE_HOUSE_TYPES,
  ...AUSTRALIAN_HOUSE_TYPES,
};

export type BuildTypeId = keyof typeof BUILD_TYPE_CATALOG;
