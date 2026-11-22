// Serve a native MP4 range from the current tab's buffered bytes and fetch
// only the missing suffix. A tab keeps its own recording version and lifetime.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function getHead(clientId, path) {
  const client = clientId && await self.clients.get(clientId);
  if (!client) return null;
  return new Promise(resolve => {
    const channel = new MessageChannel();
    function finish(head) {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(head);
    }
    const timeout = setTimeout(() => finish(null), 500);
    channel.port1.onmessage = event => finish(event.data);
    client.postMessage({ type: 'eponax:attention-head', path }, [channel.port2]);
  });
}

function join(prefix, suffix) {
  const readers = [prefix.stream().getReader(), suffix.getReader()];
  return new ReadableStream({
    async pull(controller) {
      while (readers.length) {
        const { value, done } = await readers[0].read();
        if (!done) { controller.enqueue(value); return; }
        readers.shift();
      }
      controller.close();
    },
    cancel(reason) { return Promise.all(readers.map(reader => reader.cancel(reason))); },
  });
}

async function serve(event, url, path) {
  const { request } = event;
  const original = () => fetch(url, { headers: request.headers, signal: request.signal });
  const range = request.headers.get('Range');
  const match = range && /^bytes=(\d+)-(\d*)$/i.exec(range);
  if (range && !match) return original();
  const head = await getHead(event.clientId, path);
  if (!head) return original();
  const start = match ? Number(match[1]) : 0;
  const end = match?.[2] ? Math.min(Number(match[2]), head.total - 1) : head.total - 1;
  const condition = request.headers.get('If-Range');
  if (start >= head.file.size || end < start || (condition && condition !== head.validator)) return original();

  const prefix = head.file.slice(start, end + 1);
  let body = prefix;
  if (end >= head.file.size) {
    const tail = await fetch(url, {
      headers: { Range: `bytes=${head.file.size}-${end}`, 'If-Range': head.validator },
      signal: request.signal,
    });
    if (tail.status === 200) return tail;
    const tag = tail.headers.get('ETag');
    const validator = tag && !tag.startsWith('W/') ? tag : tail.headers.get('Last-Modified');
    if (!tail.body || tail.status !== 206 || validator !== head.validator ||
        tail.headers.get('Content-Range') !== `bytes ${head.file.size}-${end}/${head.total}`) {
      await tail.body?.cancel();
      return original();
    }
    body = join(prefix, tail.body);
  }
  const headers = new Headers({ 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
    'Content-Length': String(end + 1 - start), 'Cache-Control': 'no-store' });
  headers.set(head.validator.startsWith('"') ? 'ETag' : 'Last-Modified', head.validator);
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${head.total}`);
  return new Response(body, { status: range ? 206 : 200, headers });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.search !== '?eponax-start=1') return;
  const path = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (!/^attention\/(city|night)_\d+\.mp4$/.test(path) ||
      url.href !== new URL(path + url.search, self.registration.scope).href) return;
  url.search = '';
  event.respondWith(serve(event, url, path));
});
