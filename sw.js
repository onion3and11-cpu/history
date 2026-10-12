const C='history-goddess-v2';
const A=['./','index.html','styles.css','app.js','content.js','questions.js','review.js','manifest.json','assets/cover.png','assets/near-east.jpg','assets/reformation-map.jpg','assets/heliocentric.jpg','assets/hellenistic.jpg','assets/roman-law.jpg','assets/hebrews.jpg','assets/church-state.jpg','assets/feudal.jpg','assets/thirty-years.jpg','assets/methods.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
