const CACHE='cronicas-aventurero-v21-spell-slot-icons';
const ASSETS=['./','./index.html','./motion.js','./manifest.webmanifest','./icon-192.png','./icon-512.png',
 './assets/spell-icons/Icono_Artifice.png','./assets/spell-icons/Icono_Barbaro.png','./assets/spell-icons/Icono_Bardo.png','./assets/spell-icons/Icono_Brujo.png',
 './assets/spell-icons/Icono_Clerigo.png','./assets/spell-icons/Icono_Druida.png','./assets/spell-icons/Icono_Explorador.png','./assets/spell-icons/Icono_Guerrero.png',
 './assets/spell-icons/Icono_Hechicero.png','./assets/spell-icons/Icono_Mago.png','./assets/spell-icons/Icono_Monje.png','./assets/spell-icons/Icono_Paladin.png',
 './assets/spell-icons/Icono_Picaro.png','./assets/spell-icons/Icono_Pugilista.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cronicas-aventurero-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy)).catch(()=>{});}
   return response;
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
