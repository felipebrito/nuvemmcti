// Service Worker para persistência ultra robusta
const CACHE_NAME = 'wcloud-v1';
const DATA_KEY = 'wcloud-words-data';

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened');
        return cache.addAll([
          '/',
          '/index.html',
          '/src/main.jsx',
          '/src/VideoWordCloud.jsx',
          '/src/VideoWordCloud.css'
        ]);
      })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Interceptar requisições de dados
  if (event.request.url.includes('/api/words')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[SW] Serving from cache:', event.request.url);
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Receber mensagens do app principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SAVE_WORDS') {
    console.log('[SW] Saving words data:', event.data.words);
    // Salvar no cache do Service Worker
    caches.open(CACHE_NAME)
      .then((cache) => {
        const response = new Response(JSON.stringify(event.data.words), {
          headers: { 'Content-Type': 'application/json' }
        });
        return cache.put('/api/words', response);
      })
      .then(() => {
        console.log('[SW] Words data saved successfully');
        // Notificar o app principal
        event.ports[0].postMessage({ type: 'SAVE_SUCCESS' });
      })
      .catch((error) => {
        console.error('[SW] Error saving words:', error);
        event.ports[0].postMessage({ type: 'SAVE_ERROR', error: error.message });
      });
  }
  
  if (event.data && event.data.type === 'LOAD_WORDS') {
    console.log('[SW] Loading words data...');
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.match('/api/words');
      })
      .then((response) => {
        if (response) {
          return response.json();
        }
        return null;
      })
      .then((words) => {
        console.log('[SW] Words data loaded:', words);
        event.ports[0].postMessage({ type: 'LOAD_SUCCESS', words });
      })
      .catch((error) => {
        console.error('[SW] Error loading words:', error);
        event.ports[0].postMessage({ type: 'LOAD_ERROR', error: error.message });
      });
  }
  
  if (event.data && event.data.type === 'CLEAR_WORDS') {
    console.log('[SW] Clearing words data...');
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.delete('/api/words');
      })
      .then((deleted) => {
        console.log('[SW] Words data cleared:', deleted);
        event.ports[0].postMessage({ type: 'CLEAR_SUCCESS' });
      })
      .catch((error) => {
        console.error('[SW] Error clearing words:', error);
        event.ports[0].postMessage({ type: 'CLEAR_ERROR', error: error.message });
      });
  }
}); 