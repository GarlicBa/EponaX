// Let one pair reach its first decoded frames before starting more players.
// Already playing pairs keep looping. A user-selected pair goes first in line.
const pending: (() => void)[] = [];
const starting = new Set<() => void>();

export function queueAttentionStart(start: () => void, preferred: boolean) {
  let timeout: number;
  const begin = () => {
    starting.add(begin);
    timeout = window.setTimeout(release, 4500);
    start();
  };
  function release() {
    window.clearTimeout(timeout);
    const queued = pending.indexOf(begin);
    if (queued >= 0) pending.splice(queued, 1);
    if (starting.delete(begin)) pending.shift()?.();
  }
  if (starting.size < 2) begin();
  else if (preferred) pending.unshift(begin);
  else pending.push(begin);
  return release;
}
