// Full NAVSIM rows and emphasis from the submission appendix, in paper order.
export type NavtestRow = { name: string; input?: string; rl: boolean | null; scores: number[]; bold: number[] };
export type NavhardRow = { name: string; stages: number[][]; bold: number[][]; combined: number };

export const v1: NavtestRow[] = [
  {"name": "Human", "rl": null, "input": "—", "scores": [100.0, 100.0, 87.5, 100.0, 99.9, 94.8], "bold": []},
  {"name": "TransFuser", "rl": false, "input": "3C+L", "scores": [97.7, 92.8, 79.2, 92.8, 100.0, 84.0], "bold": [4]},
  {"name": "Epona", "rl": false, "input": "1C", "scores": [97.9, 95.1, 80.4, 93.8, 99.9, 86.2], "bold": []},
  {"name": "DiffusionDrive", "rl": false, "input": "3C+L", "scores": [98.2, 96.2, 82.2, 94.7, 100.0, 88.1], "bold": [4]},
  {"name": "VGGDrive", "rl": false, "input": "3C", "scores": [98.6, 96.3, 82.9, 95.6, 100.0, 88.8], "bold": [4]},
  {"name": "AutoVLA", "rl": false, "input": "3C", "scores": [96.9, 92.4, 75.8, 88.1, 99.9, 80.5], "bold": []},
  {"name": "DriveLaW", "rl": false, "input": "1C", "scores": [99.0, 97.1, 81.3, 96.7, 100.0, 89.1], "bold": [4]},
  {"name": "EponaV2", "rl": false, "input": "1C", "scores": [98.6, 97.3, 83.6, 95.3, 99.9, 89.4], "bold": []},
  {"name": "DriveVLA-W0", "rl": false, "input": "1C", "scores": [98.7, 99.1, 83.3, 95.3, 99.3, 90.2], "bold": [1]},
  {"name": "HyWorldVLA", "rl": false, "input": "1C", "scores": [98.6, 98.9, 84.6, 95.1, 99.9, 90.6], "bold": []},
  {"name": "DriveVA", "rl": false, "input": "1C", "scores": [99.2, 97.5, 83.5, 98.7, 100.0, 90.9], "bold": [3, 4]},
  {"name": "Auto-JEPA", "rl": false, "input": "1C", "scores": [98.4, 98.3, 87.1, 95.0, 100.0, 91.3], "bold": [4]},
  {"name": "PhysWAM", "rl": false, "input": "3C", "scores": [99.0, 97.5, 88.7, 98.5, 99.8, 91.4], "bold": [2]},
  {"name": "EponaX", "rl": false, "input": "6C", "scores": [99.3, 98.5, 85.0, 97.4, 100.0, 91.9], "bold": [0, 4, 5]},
  {"name": "AutoVLA", "rl": true, "input": "3C", "scores": [98.4, 95.6, 81.9, 98.0, 99.9, 89.1], "bold": []},
  {"name": "AutoDrive-P³", "rl": true, "input": "3C", "scores": [99.1, 97.4, 84.8, 96.5, 100.0, 90.6], "bold": [4]},
  {"name": "ReCogDrive", "rl": true, "input": "1C", "scores": [97.9, 97.3, 87.3, 94.9, 100.0, 90.8], "bold": [2, 4]},
  {"name": "ExploreVLA", "rl": true, "input": "1C", "scores": [98.8, 98.4, 83.5, 96.5, 99.9, 90.4], "bold": []},
  {"name": "EponaV2", "rl": true, "input": "1C", "scores": [98.6, 97.9, 84.8, 95.7, 100.0, 90.4], "bold": [4]},
  {"name": "Qwen-Drive-RL", "rl": true, "input": "3C", "scores": [98.6, 98.2, 84.8, 95.9, 100.0, 90.7], "bold": [4]},
  {"name": "EponaX", "rl": true, "input": "6C", "scores": [99.3, 98.9, 85.7, 97.6, 100.0, 92.5], "bold": [0, 1, 3, 4, 5]},
];

export const v2: NavtestRow[] = [
  {"name": "Human", "rl": null, "scores": [100.0, 100.0, 99.8, 100.0, 87.4, 100.0, 100.0, 98.1, 90.1, 94.5], "bold": []},
  {"name": "TransFuser", "rl": false, "scores": [96.9, 89.9, 97.8, 99.7, 87.1, 95.4, 92.7, 98.3, 87.2, 84.0], "bold": []},
  {"name": "Epona", "rl": false, "scores": [97.9, 95.2, 99.4, 99.8, 86.5, 97.1, 96.5, 98.3, 70.4, 85.2], "bold": []},
  {"name": "DriveVLA-W0", "rl": false, "scores": [98.4, 95.2, 99.4, 99.9, 86.6, 97.9, 97.8, 98.3, 82.7, 86.9], "bold": [3]},
  {"name": "WoTE", "rl": false, "scores": [98.5, 96.8, 98.8, 99.8, 86.1, 97.9, 95.5, 98.3, 82.9, 87.7], "bold": []},
  {"name": "DiffusionDrive", "rl": false, "scores": [98.2, 96.2, 99.5, 99.8, 87.4, 97.3, 96.9, 98.4, 87.7, 88.2], "bold": []},
  {"name": "PWM", "rl": false, "scores": [98.8, 95.9, 99.4, 99.9, 86.4, 98.4, 97.6, 98.3, 85.3, 88.2], "bold": [3]},
  {"name": "DriveLaW", "rl": false, "scores": [98.7, 96.9, 99.6, 99.8, 87.5, 98.3, 97.6, 98.4, 77.4, 88.6], "bold": []},
  {"name": "Auto-JEPA", "rl": false, "scores": [98.5, 98.7, 98.3, 99.7, 90.5, 97.9, 94.7, 97.8, 75.2, 89.1], "bold": [1, 4]},
  {"name": "HyWorldVLA", "rl": false, "scores": [98.8, 98.2, 99.5, 99.9, 87.8, 98.1, 96.2, 98.3, 77.4, 89.7], "bold": [3]},
  {"name": "PhysWAM", "rl": false, "scores": [99.0, 97.5, 99.3, 99.8, 88.7, 98.5, 96.5, 98.6, 90.5, 90.3], "bold": [7, 8]},
  {"name": "EponaX", "rl": false, "scores": [99.2, 98.4, 99.8, 99.9, 87.4, 98.9, 98.5, 98.3, 81.4, 91.1], "bold": [0, 2, 3, 5, 6, 9]},
  {"name": "ExploreVLA", "rl": true, "scores": [98.8, 96.2, 99.6, 99.8, 87.1, 98.2, 97.8, 98.3, 86.8, 88.8], "bold": [8]},
  {"name": "EponaV2", "rl": true, "scores": [98.5, 97.4, 99.5, 99.9, 87.9, 98.1, 97.7, 98.2, 77.4, 88.9], "bold": [3]},
  {"name": "AutoDrive-P³", "rl": true, "scores": [99.1, 97.4, 99.2, 99.8, 88.0, 98.7, 96.3, 98.3, 85.5, 89.9], "bold": [4]},
  {"name": "EponaX", "rl": true, "scores": [99.3, 98.6, 99.8, 99.9, 88.0, 99.0, 98.6, 98.4, 83.1, 91.8], "bold": [0, 1, 2, 3, 4, 5, 6, 7, 9]},
];

export const navhard: NavhardRow[] = [
  {"name": "DriveVLA-W0", "stages": [[96.8, 83.3, 99.0, 99.6, 84.6, 95.3, 96.4, 97.6, 78.2], [76.8, 64.3, 79.9, 98.3, 89.2, 75.0, 46.8, 95.8, 53.1]], "bold": [[], [4]], "combined": 24.4},
  {"name": "ReCogDrive", "stages": [[96.4, 78.9, 98.7, 99.8, 82.6, 95.6, 94.4, 97.6, 74.2], [80.2, 65.0, 82.4, 98.7, 85.2, 76.9, 43.8, 96.6, 71.8]], "bold": [[], [7]], "combined": 25.7},
  {"name": "DiffusionDrive", "stages": [[96.8, 86.0, 98.8, 99.3, 84.0, 95.8, 96.7, 97.6, 79.6], [80.1, 72.8, 84.4, 98.4, 85.9, 76.6, 46.4, 96.3, 72.8]], "bold": [[8], [8]], "combined": 27.5},
  {"name": "DriveLaW", "stages": [[97.3, 89.1, 99.2, 99.6, 84.3, 97.1, 96.2, 97.8, 67.6], [82.5, 67.6, 83.5, 98.1, 84.8, 78.5, 45.8, 96.4, 57.3]], "bold": [[7], []], "combined": 30.6},
  {"name": "GeoWAM", "stages": [[97.7, 91.5, 99.1, 99.8, 83.8, 95.8, 96.0, 97.8, 79.0], [80.4, 76.3, 87.3, 98.7, 88.9, 76.2, 49.9, 94.0, 56.0]], "bold": [[7], []], "combined": 36.6},
  {"name": "PhysWAM", "stages": [[96.9, 90.9, 99.0, 99.6, 83.8, 95.6, 95.8, 97.8, 67.6], [83.9, 80.2, 87.3, 98.7, 88.7, 81.6, 48.9, 95.3, 54.4]], "bold": [[7], [1]], "combined": 38.1},
  {"name": "Epona", "stages": [[96.7, 88.9, 98.1, 99.6, 84.0, 95.6, 94.4, 97.6, 58.2], [80.7, 74.5, 86.6, 98.7, 87.0, 77.2, 49.7, 96.5, 50.2]], "bold": [[], []], "combined": 31.6},
  {"name": "EponaV2", "stages": [[97.3, 90.7, 99.4, 100.0, 83.3, 97.3, 97.3, 97.6, 60.9], [83.6, 78.0, 88.0, 98.9, 86.0, 80.3, 50.1, 96.1, 52.0]], "bold": [[3], [3]], "combined": 36.1},
  {"name": "EponaX", "stages": [[98.4, 93.6, 99.6, 100.0, 84.8, 98.4, 97.8, 97.8, 72.9], [85.9, 79.6, 89.2, 98.7, 85.7, 81.8, 50.7, 96.4, 65.3]], "bold": [[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 5, 6]], "combined": 48.3},
];

export const family = [
  { name: 'Epona', parameters: 2.5 },
  { name: 'EponaV2', parameters: 6.7 },
  { name: 'EponaX', parameters: 3.1 },
];

export const transfer = [
  {"name": "PWM", "nuScenes": {"L2": [2.06, 3.91, 6.0, 3.99], "collision": [0.12, 0.15, 0.86, 0.36]}, "Bench2Drive": {"L2": [1.7, 2.74, 3.97, 2.8], "collision": [4.01, 3.73, 3.53, 3.76]}},
  {"name": "DriveVLA-W0", "nuScenes": {"L2": [0.43, 1.26, 2.6, 1.43], "collision": [0.22, 0.66, 1.42, 0.77]}, "Bench2Drive": {"L2": [1.01, 2.77, 5.22, 3.0], "collision": [1.49, 2.53, 3.53, 2.52]}},
  {"name": "DriveVA", "nuScenes": {"L2": [0.33, 0.76, 1.43, 0.84], "collision": [0.0, 0.07, 0.12, 0.06]}, "Bench2Drive": {"L2": [0.69, 1.29, 2.03, 1.33], "collision": [1.38, 1.97, 2.65, 1.79]}},
  {"name": "EponaX", "nuScenes": {"L2": [0.47, 0.81, 1.26, 0.85], "collision": [0.02, 0.02, 0.1, 0.05]}, "Bench2Drive": {"L2": [0.57, 1.13, 1.83, 1.18], "collision": [1.09, 1.19, 1.69, 1.33]}},
];
