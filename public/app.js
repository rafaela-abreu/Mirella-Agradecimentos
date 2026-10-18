const gallery = document.querySelector('#gallery');
const count = document.querySelector('#photoCount');
const musicFrame = document.querySelector('#musicFrame');
const thankYouVideo = document.querySelector('#thankYouVideo');
const parabensVideo = document.querySelector('#parabensVideo');
const youtubeId = 'Yb9vPpm9AcI';
let musicStarted = false;
let musicPlayer;

function startMusic() {
  if (musicStarted || !musicFrame) return;
  musicStarted = true;
  musicFrame.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  window.onYouTubeIframeAPIReady = () => {
    musicPlayer = new YT.Player('musicFrame', {
      events: {
        onReady: event => {
          event.target.setVolume(100);
          event.target.unMute();
          event.target.playVideo();
        }
      }
    });
  };
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(api);
}

function openVideoFullscreen(video) {
  if (!video) return;
  const enter = video.requestFullscreen ? video.requestFullscreen() : video.webkitEnterFullscreen?.();
  const play = video.play();
  if (enter?.catch) enter.catch(() => {});
  if (play?.catch) play.catch(() => {});
}

for (const video of [thankYouVideo, parabensVideo]) {
  video?.addEventListener('click', () => openVideoFullscreen(video));
  video?.addEventListener('webkitbeginfullscreen', () => { video.muted = false; });
  video?.addEventListener('webkitendfullscreen', () => { video.muted = true; });
}

document.addEventListener('fullscreenchange', () => {
  for (const video of [thankYouVideo, parabensVideo]) {
    if (video) video.muted = document.fullscreenElement !== video;
  }
});

const messageSection = document.querySelector('.message');
if (messageSection && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry], observer) => {
    if (entry.isIntersecting) { startMusic(); observer.disconnect(); }
  }, { threshold: 0.15 }).observe(messageSection);
}

if (thankYouVideo) {
  thankYouVideo.volume = 1;
  const bear = document.querySelector('.bear-float');
  if (bear && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => bear.classList.toggle('hide-bear', entry.isIntersecting), { threshold: 0.12 }).observe(thankYouVideo);
  }
}

function card(photo){ const el=document.createElement('article'); el.className='photo-card'; el.innerHTML=`<img loading="lazy" src="${photo.url}" alt="Foto da festa da Mirella Rebecca"><a class="download-button" href="${photo.url}" download="mirella-foto.jpg">↓ Salvar fotinha</a>`; return el; }
async function loadGallery(){ try { let data; try { const response=await fetch('./api/gallery'); if(!response.ok) throw new Error('static'); data=await response.json(); } catch { data={photos:await fetch('./gallery.json').then(response=>response.json())}; } gallery.innerHTML=''; data.photos.forEach(p=>gallery.appendChild(card(p))); count.textContent=`${data.photos.length} ${data.photos.length===1?'fotinha':'fotinhas'}`; if(!data.photos.length) gallery.innerHTML='<p class="photo-count">As fotinhas estão chegando com muito carinho.</p>'; } catch { count.textContent='álbum em preparação'; gallery.innerHTML='<p class="photo-count">Não foi possível carregar o álbum agora.</p>'; } }

loadGallery();
