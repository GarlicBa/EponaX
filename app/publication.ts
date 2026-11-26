export const paperTitle = 'Recipes for Training and Deploying World-Action Models in the Real World';

export const affiliations = {
  1: 'Horizon Robotics',
  2: 'Nanjing University of Posts and Telecommunications',
  3: 'LogicOrigin',
  4: 'Nankai University',
  5: 'The Hong Kong University of Science and Technology',
  6: 'Shanghai Innovation Institute',
  7: 'Institut Polytechnique de Paris',
  8: 'National University of Singapore',
  9: 'Nanjing University',
  10: 'Hunan University',
  11: 'Anyverse',
} as const;

export type Author = {
  name: string; homepage?: string; affiliations: (keyof typeof affiliations)[];
  role?: 'Core contributor' | 'Project leader'; coFirst?: boolean;
};
export const authors: Author[] = [
  { name: 'Mingxiao Li', affiliations: [1], role: 'Core contributor', coFirst: true, homepage: 'https://lmx760581375.github.io/' },
  { name: 'Zhijian Shu', affiliations: [1, 2], role: 'Core contributor', coFirst: true, homepage: 'https://garlicba.github.io/' },
  { name: 'Wei Yin', affiliations: [3], role: 'Core contributor', coFirst: true, homepage: 'https://scholar.google.com/citations?user=ZIf_rtcAAAAJ&hl=en' },
  { name: 'Jiawei Xu', affiliations: [1, 4], role: 'Core contributor', coFirst: true, homepage: 'https://jiaweixu8.github.io/' },
  { name: 'Mingkai Jia', affiliations: [1, 5], role: 'Core contributor', coFirst: true, homepage: 'https://github.com/MKJia' },
  { name: 'Alan Liang', affiliations: [1, 6], role: 'Core contributor', coFirst: true, homepage: 'https://alanliangc.github.io/' },
  { name: 'Zhizhou Zhong', affiliations: [1, 5], role: 'Core contributor', coFirst: true, homepage: 'https://github.com/zzzweakman' },
  { name: 'Shiyao Li', affiliations: [1, 7], role: 'Core contributor', homepage: 'https://shiyao-li.github.io/' },
  { name: 'Dongyue Lu', affiliations: [1, 8], role: 'Core contributor', homepage: 'https://dylanorange.github.io/' },
  { name: 'Liang Yue', affiliations: [1, 9], homepage: 'https://philip-2000.github.io/cv/' },
  { name: 'Zeyuan Xu', affiliations: [10], homepage: 'https://scholar.google.com/citations?user=CSfCTQ4AAAAJ&hl=zh-CN' },
  { name: 'Kaicheng Zhang', affiliations: [11], homepage: 'https://openreview.net/profile?id=~Kaicheng_Zhang8' },
  { name: 'Xiao-Xiao Long', affiliations: [9], homepage: 'https://www.xxlong.site/' },
  { name: 'Lingdong Kong', affiliations: [8], homepage: 'https://ldkong.com/' },
  { name: 'Qian Zhang', affiliations: [1], role: 'Project leader', homepage: 'https://scholar.google.com/citations?user=pCY-bikAAAAJ&hl=zh-CN' },
];

export const resources: { label: string; href: string; target?: '_blank' }[] = [
  { label: 'Paper', href: './paper/EponaX_Tech_Report.pdf', target: '_blank' },
  { label: 'Hugging Face', href: '#top' },
];
