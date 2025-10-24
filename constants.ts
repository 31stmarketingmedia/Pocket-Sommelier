
import type { Vendor } from './types';

export const VENDORS: Vendor[] = [
  {
    name: 'Wine.com',
    affiliateLink: 'https://www.wine.com/search/{DRINK_NAME}/'
  },
  {
    name: 'Drizly',
    affiliateLink: 'https://drizly.com/search?q={DRINK_NAME}'
  },
  {
    name: 'Total Wine',
    affiliateLink: 'https://www.totalwine.com/search/all?text={DRINK_NAME}'
  }
];
