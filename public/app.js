const gallery = document.querySelector('#gallery');
const count = document.querySelector('#photoCount');
const musicButton = document.querySelector('#musicButton');
const musicFrame = document.querySelector('#musicFrame');
const thankYouVideo = document.querySelector('#thankYouVideo');
const youtubeId = 'I3raNXhVN7c';
if (thankYouVideo) {
  thankYouVideo.volume = 1;
  const bear = document.querySelector('.bear-float');
  if (bear && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => bear.classList.toggle('hide-bear', entry.isIntersecting), { threshold: 0.12 }).observe(thankYouVideo);
  }
}
function card(photo){ const el=document.createElement('article'); el.className='photo-card'; el.innerHTML=`<img loading="lazy" src="${photo.url}" alt="Foto da festa da Mirella Rebecca"><a class="download-button" href="${photo.url}" download="mirella-foto.jpg">↓ Salvar fotinha</a>`; return el; }
async function loadGallery(){ try { const response=await fetch('/api/gallery'); const data=await response.json(); gallery.innerHTML=''; data.photos.forEach(p=>gallery.appendChild(card(p))); count.textContent=`${data.photos.length} ${data.photos.length===1?'fotinha':'fotinhas'}`; if(!data.photos.length) gallery.innerHTML='<p class="photo-count">As fotinhas estão chegando com muito carinho.</p>'; } catch { count.textContent='álbum em preparação'; gallery.innerHTML='<p class="photo-count">Não foi possível carregar o álbum agora.</p>'; } }
musicButton?.addEventListener('click',()=>{ if(!musicFrame.src){ musicFrame.src=`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0`; musicButton.textContent='♫ Música tocando'; } else { musicFrame.src=''; musicButton.textContent='♪ Tocar música'; } });
loadGallery();
