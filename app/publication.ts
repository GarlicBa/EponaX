export const paperTitle = 'Recipes for Training and Deploying World-Action Models in the Real World';

export const affiliations = {
  1: 'Horizon Robotics',
  2: 'Nanjing University of Posts and Telecommunications',
  3: 'Nankai University',
  4: 'The Hong Kong University of Science and Technology',
  5: 'Shanghai Innovation Institute',
  6: 'Institut Polytechnique de Paris',
  7: 'National University of Singapore',
  8: 'Nanjing University',
  9: 'Hunan University',
  10: 'Anyverse',
  11: 'LogicOrigin',
} as const;

export type Author = { name: string; homepage?: string; affiliations: (keyof typeof affiliations)[] };
export const authors: Author[] = [
  { name: 'Mingxiao Li', affiliations: [1], homepage: 'https://lmx760581375.github.io/' },
  { name: 'Zhijian Shu', affiliations: [1, 2], homepage: 'https://garlicba.github.io/' },
  { name: 'Jiawei Xu', affiliations: [1, 3], homepage: 'https://jiaweixu8.github.io/' },
  { name: 'Mingkai Jia', affiliations: [1, 4], homepage: 'https://github.com/MKJia' },
  { name: 'Alan Liang', affiliations: [1, 5], homepage: 'https://alanliangc.github.io/' },
  { name: 'Zhizhou Zhong', affiliations: [1, 4], homepage: 'https://github.com/zzzweakman' },
  { name: 'Shiyao Li', affiliations: [1, 6], homepage: 'https://shiyao-li.github.io/' },
  { name: 'Dongyue Lu', affiliations: [1, 7], homepage: 'https://dylanorange.github.io/' },
  { name: 'Liang Yue', affiliations: [1, 8], homepage: 'https://philip-2000.github.io/cv/' },
  { name: 'Zeyuan Xu', affiliations: [9], homepage: 'https://scholar.google.com/citations?user=CSfCTQ4AAAAJ&hl=zh-CN' },
  { name: 'Kaicheng Zhang', affiliations: [10], homepage: 'https://openreview.net/profile?id=~Kaicheng_Zhang8' },
  { name: 'Xiao-Xiao Long', affiliations: [8, 11], homepage: 'https://www.xxlong.site/' },
  { name: 'Lingdong Kong', affiliations: [7], homepage: 'https://ldkong.com/' },
  { name: 'Qian Zhang', affiliations: [1], homepage: 'https://scholar.google.com/citations?user=pCY-bikAAAAJ&hl=zh-CN' },
  { name: 'Wei Yin', affiliations: [11], homepage: 'https://scholar.google.com/citations?user=ZIf_rtcAAAAJ&hl=en' },
];

export const resources: { label: string; href?: string }[] = [
  { label: 'Paper' },
  { label: 'Hugging Face' },
];
