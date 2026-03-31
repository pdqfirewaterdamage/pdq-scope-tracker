export interface Tech {
  id: string;
  name: string;
  code: string;
  avatar: string;
  closingRatio: number;
  avgJobSize: number;
}

export const TECHS: Tech[] = [
  { id: 'CB', name: 'Chris B', code: 'CB', avatar: '\uD83D\uDC77', closingRatio: 74, avgJobSize: 11200 },
  { id: 'JK', name: 'Jerry K', code: 'JK', avatar: '\uD83D\uDC77', closingRatio: 70, avgJobSize: 10400 },
  { id: 'LT', name: 'Leo T',   code: 'LT', avatar: '\uD83D\uDC77', closingRatio: 65, avgJobSize: 9100 },
  { id: 'DP', name: 'David P', code: 'DP', avatar: '\uD83D\uDC77', closingRatio: 62, avgJobSize: 8300 },
];

export const ADMIN_CODE = 'AD';
