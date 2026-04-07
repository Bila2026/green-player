// Nome do cache (mude a versão se fizer grandes alterações)
const CACHE_NAME = 'green-player-v1';

// Lista de arquivos que o app precisa para funcionar offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './script.js',
  './icons/android-icon-192x192.png',
  './icons/android-icon-512x512.png'
];

// 1. Instalação: Salva os arquivos no cache do navegador
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Arquivos em cache!');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Ativação: Limpa caches antigos se houver
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// 3. Interceptação: Serve os arquivos do cache quando estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
