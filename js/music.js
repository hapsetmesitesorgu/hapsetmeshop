/**
 * music.js — Müzik çalar sistemi
 * Playlist: music/playlist.json dosyasından otomatik yüklenir.
 * Yeni şarkı eklemek için: MP3'ü music/ klasörüne koy,
 * playlist.json'a bir satır ekle — bitti.
 */

const MusicPlayer = (() => {
  "use strict";

  // ── State ──
  let playlist   = [];
  let currentIdx = 0;
  let audio      = new Audio();
  let isPlaying  = false;
  let isDragging = false;

  // ── DOM Referansları (init sonrası doldurulur) ──
  let elWidget, elTitle, elArtist, elCover,
      elProgress, elFill, elCurrentTime, elTotalTime,
      elBtnPlay, elBtnPrev, elBtnNext,
      elBtnToggle, elVolume, elVolumeBar;

  /* ════════════════════════════════
     PLAYLIST YÜKLE
  ════════════════════════════════ */
  async function loadPlaylist() {
    try {
      const res  = await fetch("music/playlist.json?_=" + Date.now());
      playlist   = await res.json();
    } catch {
      playlist = [];
    }

    if (playlist.length === 0) {
      updateTrackInfo({ title: "Müzik yüklenemedi", artist: "HAPSETME" });
      return;
    }

    loadTrack(0);
  }

  /* ════════════════════════════════
     PARÇA YÜKLEYİCİ
  ════════════════════════════════ */
  function loadTrack(idx) {
    if (!playlist.length) return;
    currentIdx = (idx + playlist.length) % playlist.length;
    const track = playlist[currentIdx];

    audio.src = track.file;
    audio.load();

    updateTrackInfo(track);
    resetProgress();

    // Çalınıyorsa yeni parçayı da başlat
    if (isPlaying) {
      audio.play().catch(() => {});
    }

    // Playlist item'larını güncelle
    renderPlaylistItems();
  }

  function updateTrackInfo(track) {
    if (elTitle)  elTitle.textContent  = track.title  || "—";
    if (elArtist) elArtist.textContent = track.artist || "—";
  }

  function resetProgress() {
    if (elFill)        elFill.style.width        = "0%";
    if (elCurrentTime) elCurrentTime.textContent = "0:00";
    if (elTotalTime)   elTotalTime.textContent   = "0:00";
  }

  /* ════════════════════════════════
     OYNATMA KONTROLLÜ
  ════════════════════════════════ */
  function play() {
    if (!playlist.length) return;
    audio.play().then(() => {
      isPlaying = true;
      setPlayIcon(true);
    }).catch(() => {});
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    setPlayIcon(false);
  }

  function toggle() {
    isPlaying ? pause() : play();
  }

  function next() { loadTrack(currentIdx + 1); if (isPlaying) play(); }
  function prev() { loadTrack(currentIdx - 1); if (isPlaying) play(); }

  function setPlayIcon(playing) {
    if (!elBtnPlay) return;
    elBtnPlay.innerHTML = playing
      ? '<i class="fa-solid fa-pause"></i>'
      : '<i class="fa-solid fa-play"></i>';

    // Cover animasyonu
    if (elCover) {
      playing
        ? elCover.classList.add("spinning")
        : elCover.classList.remove("spinning");
    }
  }

  /* ════════════════════════════════
     ZAMAN & İLERLEME
  ════════════════════════════════ */
  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function onTimeUpdate() {
    if (isDragging || !audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (elFill)        elFill.style.width        = pct + "%";
    if (elCurrentTime) elCurrentTime.textContent = formatTime(audio.currentTime);
  }

  function onLoadedMetadata() {
    if (elTotalTime) elTotalTime.textContent = formatTime(audio.duration);
  }

  function seekTo(e) {
    if (!audio.duration) return;
    const rect = elProgress.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    if (elFill) elFill.style.width = (pct * 100) + "%";
  }

  /* ════════════════════════════════
     SES SEVİYESİ
  ════════════════════════════════ */
  function setVolume(val) {
    audio.volume = Math.max(0, Math.min(1, val));
    if (elVolumeBar) elVolumeBar.style.width = (audio.volume * 100) + "%";
    localStorage.setItem("hs_volume", audio.volume);
  }

  /* ════════════════════════════════
     PLAYLİST PANELİ
  ════════════════════════════════ */
  function renderPlaylistItems() {
    const list = document.getElementById("mp-playlist-items");
    if (!list) return;

    list.innerHTML = playlist.map((t, i) => `
      <div class="mp-pl-item ${i === currentIdx ? "active" : ""}" onclick="MusicPlayer.jumpTo(${i})">
        <span class="mp-pl-num">${i + 1}</span>
        <div class="mp-pl-info">
          <span class="mp-pl-title">${t.title}</span>
          <span class="mp-pl-artist">${t.artist}</span>
        </div>
        ${i === currentIdx ? '<i class="fa-solid fa-volume-high mp-pl-playing"></i>' : ""}
      </div>
    `).join("");
  }

  /* ════════════════════════════════
     WİDGET OLUŞTUR & BAŞLAT
  ════════════════════════════════ */
  function createWidget() {
    const widget = document.createElement("div");
    widget.id        = "music-widget";
    widget.className = "music-widget";
    widget.innerHTML = `
      <!-- Kapatma / Açma butonu -->
      <button class="mp-toggle" id="mp-toggle-btn" title="Müzik Çalar">
        <i class="fa-solid fa-music"></i>
      </button>

      <!-- Ana panel -->
      <div class="mp-panel" id="mp-panel">
        <!-- Başlık -->
        <div class="mp-header">
          <span class="mp-label"><i class="fa-solid fa-headphones"></i> Müzik Çalar</span>
          <button class="mp-close" id="mp-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Şarkı bilgisi -->
        <div class="mp-track">
          <div class="mp-cover" id="mp-cover">
            <i class="fa-solid fa-music"></i>
          </div>
          <div class="mp-meta">
            <span class="mp-title" id="mp-title">Yükleniyor...</span>
            <span class="mp-artist" id="mp-artist">HAPSETME</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mp-progress-wrap" id="mp-progress">
          <div class="mp-progress-bg">
            <div class="mp-progress-fill" id="mp-fill"></div>
            <div class="mp-progress-thumb"></div>
          </div>
        </div>
        <div class="mp-times">
          <span id="mp-current">0:00</span>
          <span id="mp-total">0:00</span>
        </div>

        <!-- Kontroller -->
        <div class="mp-controls">
          <button class="mp-btn mp-btn-sm" id="mp-prev"><i class="fa-solid fa-backward-step"></i></button>
          <button class="mp-btn mp-btn-main" id="mp-play"><i class="fa-solid fa-play"></i></button>
          <button class="mp-btn mp-btn-sm" id="mp-next"><i class="fa-solid fa-forward-step"></i></button>
        </div>

        <!-- Ses seviyesi -->
        <div class="mp-volume-row">
          <i class="fa-solid fa-volume-low mp-vol-icon"></i>
          <div class="mp-volume-track" id="mp-volume-track">
            <div class="mp-volume-fill" id="mp-volume-fill"></div>
          </div>
          <i class="fa-solid fa-volume-high mp-vol-icon"></i>
        </div>

        <!-- Playlist -->
        <div class="mp-playlist-wrap">
          <div class="mp-pl-header">
            <i class="fa-solid fa-list"></i> Playlist
            <span class="mp-pl-count">${playlist.length} şarkı</span>
          </div>
          <div class="mp-playlist-items" id="mp-playlist-items"></div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);
  }

  function bindEvents() {
    elWidget      = document.getElementById("music-widget");
    elTitle       = document.getElementById("mp-title");
    elArtist      = document.getElementById("mp-artist");
    elCover       = document.getElementById("mp-cover");
    elProgress    = document.getElementById("mp-progress");
    elFill        = document.getElementById("mp-fill");
    elCurrentTime = document.getElementById("mp-current");
    elTotalTime   = document.getElementById("mp-total");
    elBtnPlay     = document.getElementById("mp-play");
    elBtnPrev     = document.getElementById("mp-prev");
    elBtnNext     = document.getElementById("mp-next");
    elBtnToggle   = document.getElementById("mp-toggle-btn");
    elVolumeBar   = document.getElementById("mp-volume-fill");

    const panel    = document.getElementById("mp-panel");
    const closeBtn = document.getElementById("mp-close-btn");
    const volTrack = document.getElementById("mp-volume-track");

    // Play/Pause
    elBtnPlay.addEventListener("click", toggle);
    elBtnPrev.addEventListener("click", prev);
    elBtnNext.addEventListener("click", next);

    // Panel aç/kapat
    elBtnToggle.addEventListener("click", () => {
      panel.classList.toggle("visible");
      elBtnToggle.classList.toggle("active");
    });
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("visible");
      elBtnToggle.classList.remove("active");
    });

    // Audio olayları
    audio.addEventListener("timeupdate",    onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended",          () => next());

    // Progress tıklama & sürükleme
    elProgress.addEventListener("click", seekTo);
    elProgress.addEventListener("mousedown", () => { isDragging = true; });
    document.addEventListener("mousemove", (e) => { if (isDragging) seekTo(e); });
    document.addEventListener("mouseup",   ()  => { isDragging = false; });

    // Ses seviyesi
    const savedVol = parseFloat(localStorage.getItem("hs_volume") ?? "0.7");
    setVolume(savedVol);

    volTrack.addEventListener("click", (e) => {
      const rect = volTrack.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      setVolume(pct);
    });

    // Space ile play/pause (input odaklanmamışsa)
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        toggle();
      }
    });
  }

  /* ════════════════════════════════
     PUBLIC API
  ════════════════════════════════ */
  async function init() {
    createWidget();
    bindEvents();
    await loadPlaylist();
    renderPlaylistItems();
  }

  return {
    init,
    play, pause, toggle, next, prev,
    jumpTo: (i) => { loadTrack(i); if (isPlaying) play(); else play(); },
  };
})();

// Sayfa hazır olunca başlat
document.addEventListener("DOMContentLoaded", () => MusicPlayer.init());
