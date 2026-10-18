const gallery = document.querySelector('#gallery');
const count = document.querySelector('#photoCount');
const musicFrame = document.querySelector('#musicFrame');
const thankYouVideo = document.querySelector('#thankYouVideo');
const parabensVideo = document.querySelector('#parabensVideo');
const bear = document.querySelector('#bearFloat');
const musicAudio = new Audio('./media/mirella-background-music.mp3');
musicAudio.volume = 1;
musicAudio.loop = true;
musicAudio.preload = 'auto';
const bearPositionKey = 'mirella-teddy-position-thanks-v1';
let musicStarted = false;
let musicStarting = false;
let musicNeedsGesture = false;
let messageVisible = false;
let musicPausedForDrag = false;
let dragState = null;
let bearPosition = null;
let bearSoundTimer;
const bearSound = bear ? new Audio('./media/risadinha-final.mp3') : null;
if (bearSound) {
  bearSound.volume = 0.52;
  bearSound.loop = true;
  bearSound.preload = 'auto';
}

function startMusic() {
  if (musicStarted || musicStarting) return;
  musicStarting = true;
  const playback = musicAudio.play();
  if (playback && typeof playback.then === 'function') {
    playback.then(() => {
      musicStarted = true;
      musicStarting = false;
      musicNeedsGesture = false;
    }).catch(() => {
      musicStarting = false;
      musicNeedsGesture = true;
    });
  } else {
    musicStarted = true;
    musicStarting = false;
  }
}
function retryMusicFromGesture() {
  if (messageVisible && musicNeedsGesture && !musicStarted && !musicStarting) startMusic();
}
for (const eventName of ['pointerdown', 'pointerup', 'touchend', 'keydown']) {
  document.addEventListener(eventName, retryMusicFromGesture, { passive: true });
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
    if (entry.isIntersecting) { messageVisible = true; startMusic(); observer.disconnect(); }
  }, { threshold: 0.15 }).observe(messageSection);
}

function clampBearPosition(x, y) {
  const rect = bear.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
    y: Math.max(35, Math.min(y, window.innerHeight - rect.height - 8))
  };
}
function setBearPosition(x, y, save = false) {
  const position = clampBearPosition(x, y);
  bear.style.left = `${position.x}px`;
  bear.style.top = `${position.y}px`;
  bear.style.right = 'auto';
  bear.style.bottom = 'auto';
  bearPosition = position;
  if (save) {
    try { localStorage.setItem(bearPositionKey, JSON.stringify(position)); } catch {}
  }
}
function playBearSound() {
  if (!bearSound) return;
  window.clearTimeout(bearSoundTimer);
  musicPausedForDrag = !musicAudio.paused;
  if (musicPausedForDrag) musicAudio.pause();
  bearSound.currentTime = 0;
  bearSound.play().catch(() => {});
}
function stopBearSound() {
  if (bearSound) {
    bearSound.pause();
    bearSound.currentTime = 0;
  }
  if (musicPausedForDrag) {
    const playback = musicAudio.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(() => { musicStarted = true; musicNeedsGesture = false; })
        .catch(() => { musicStarted = false; musicNeedsGesture = true; });
    } else {
      musicStarted = true;
    }
  }
  musicPausedForDrag = false;
}
function finishBearDrag() {
  if (!dragState) return;
  dragState = null;
  bear.classList.remove('dragging');
  setBearPosition(bearPosition.x, bearPosition.y, true);
  stopBearSound();
}

if (bear) {
  bearPosition = (() => {
    const rect = bear.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  })();
  try {
    const saved = JSON.parse(localStorage.getItem(bearPositionKey) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) setBearPosition(saved.x, saved.y);
  } catch {}

  bear.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0) || dragState) return;
    event.preventDefault();
    bear.classList.add('dragging');
    const rect = bear.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    bear.setPointerCapture(event.pointerId);
    setBearPosition(rect.left, rect.top);
    playBearSound();
  });
  bear.addEventListener('pointermove', event => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setBearPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
  });
  bear.addEventListener('pointerup', finishBearDrag);
  bear.addEventListener('pointercancel', finishBearDrag);
  bear.addEventListener('lostpointercapture', finishBearDrag);
  bear.addEventListener('keydown', event => {
    const movement = event.shiftKey ? 60 : 20;
    const directions = {
      ArrowLeft: [-movement, 0], ArrowRight: [movement, 0],
      ArrowUp: [0, -movement], ArrowDown: [0, movement]
    };
    if (directions[event.key]) {
      event.preventDefault();
      const rect = bear.getBoundingClientRect();
      setBearPosition(rect.left + directions[event.key][0], rect.top + directions[event.key][1], true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playBearSound();
      bearSoundTimer = window.setTimeout(stopBearSound, 2200);
    }
  });
  window.addEventListener('resize', () => {
    if (bearPosition) setBearPosition(bearPosition.x, bearPosition.y, true);
  });
}

if (thankYouVideo && bear && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => bear.classList.toggle('hide-bear', entry.isIntersecting), { threshold: 0.12 }).observe(thankYouVideo);
}

if (thankYouVideo) thankYouVideo.volume = 1;

function card(photo){ const el=document.createElement('article'); el.className='photo-card'; el.innerHTML=`<img loading="lazy" src="${photo.url}" alt="Foto da festa da Mirella Rebecca"><a class="download-button" href="${photo.url}" download="mirella-foto.jpg">↓ Salvar fotinha</a>`; return el; }
async function loadGallery(){ try { let data; try { const response=await fetch('./api/gallery'); if(!response.ok) throw new Error('static'); data=await response.json(); } catch { data={photos:await fetch('./gallery.json').then(response=>response.json())}; } gallery.innerHTML=''; data.photos.forEach(p=>gallery.appendChild(card(p))); count.textContent=`${data.photos.length} ${data.photos.length===1?'fotinha':'fotinhas'}`; if(!data.photos.length) gallery.innerHTML='<p class="photo-count">As fotinhas estão chegando com muito carinho.</p>'; } catch { count.textContent='álbum em preparação'; gallery.innerHTML='<p class="photo-count">Não foi possível carregar o álbum agora.</p>'; } }

loadGallery();
