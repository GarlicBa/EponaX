import { useEffect, useState, type RefObject } from 'react';

export type Scene = { id: string; category: 'city' | 'night' | 'highway' | 'glare'; title: string; duration: number; video: string; poster: string; data: string };
export type Frame = { speed: number | null; steering: number | null; road: string; limit: number | null; signal: 'left' | 'right' | null; navigation: number[][]; projection: number[][]; intervention: boolean; };
export type Guidance = {
  frame: number; maneuver?: number; meters?: number; nextRoad?: string;
  lanes?: [number, number][]; tripMeters?: number;
  modelLanes?: { link: number; recommended: number[]; slots: number; action: number; meters?: number }[];
};
export type Recording = { guidance?: Guidance[]; fps: number; duration: number; frames: Frame[] };
export const categories = { city: 'Urban driving', night: 'After dark', highway: 'Highway', glare: 'Against the light' };
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export function clock(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
export function useReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduce(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  return reduce;
}
export function useVisible(ref: RefObject<Element | null>, topOverlaySelector?: string) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let inView = false;
    const overlay = topOverlaySelector ? document.querySelector(topOverlaySelector) : null;
    const sync = () => setVisible(inView && !document.hidden
      && (!overlay || !document.fullscreenElement || document.fullscreenElement.contains(node)));
    let observer: IntersectionObserver;
    let inset: number;
    const observe = () => {
      const height = overlay && !document.fullscreenElement ? overlay.getBoundingClientRect().height : 0;
      if (height === inset) { sync(); return; }
      inset = height;
      observer?.disconnect();
      observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= .05;
        sync();
      }, { rootMargin: `-${height}px 0px 0px`, threshold: [0, .05] });
      observer.observe(node);
    };
    observe();
    const resize = overlay ? new ResizeObserver(observe) : null;
    if (overlay) {
      resize?.observe(overlay);
      document.addEventListener('fullscreenchange', observe);
    }
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      resize?.disconnect();
      document.removeEventListener('fullscreenchange', observe);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref, topOverlaySelector]);
  return visible;
}
