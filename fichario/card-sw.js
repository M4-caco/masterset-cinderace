/* Scorace binder: persistent same-origin image cache. */
const CARD_CACHE="scorace-card-images-v1";
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||req.destination!=="image")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CARD_CACHE);
  const cached=await cache.match(req,{ignoreVary:true});
  if(cached)return cached;
  try{
   const response=await fetch(req);
   if(response.ok){event.waitUntil(cache.put(req,response.clone()).catch(()=>{}))}
   return response
  }catch(error){
   const fallback=await cache.match(req,{ignoreVary:true});
   if(fallback)return fallback;
   throw error
  }
 })())
});
