const C='history-goddess-v4';
const A=['./','index.html','styles.css','app.js','content.js','questions.js','review.js','manifest.json','cover.png','near-east.jpg','reformation-map.jpg','heliocentric.jpg','hellenistic.jpg','roman-law.jpg','hebrews.jpg','church-state.jpg','feudal.jpg','thirty-years.jpg','methods.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));