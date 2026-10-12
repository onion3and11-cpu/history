const CACHE='history-goddess-v5-images';
const IMAGES=['cover.png','near-east.jpg','reformation-map.jpg','heliocentric.jpg','hellenistic.jpg','roman-law.jpg','hebrews.jpg','church-state.jpg','feudal.jpg','thirty-years.jpg','methods.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(IMAGES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  const isCode=req.mode==='navigate'||/\.(?:html|js|css|json)$/.test(url.pathname);
  if(isCode){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
    return;
  }
  if(req.destination==='image'){
    e.respondWith(caches.match(req).then(cached=>{
      const fresh=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>cached);
      return cached||fresh;
    }));
  }
});