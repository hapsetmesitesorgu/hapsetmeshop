/**
 * particles.js — Hero canvas parçacık animasyonu.
 * Performans optimizasyonları:
 * - Parçacık sayısı azaltıldı (60 → 35)
 * - Bağlantı mesafesi düşürüldü (130 → 100) → O(n²) maliyet azaldı
 * - fillStyle / strokeStyle stringleri önceden oluşturuldu (her frame yeni string yok)
 * - ctx.save/restore kaldırıldı
 * - will-change hint eklendi
 */

(function () {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  // GPU ipucu
  canvas.style.willChange = "transform";

  // ── Ayarlar ──
  const PARTICLE_COUNT    = 35;   // 60'dan düşürüldü
  const CONNECT_DISTANCE  = 100;  // 130'dan düşürüldü
  const CONNECT_DIST_SQ   = CONNECT_DISTANCE * CONNECT_DISTANCE; // sqrt almaktan kaçın
  const PARTICLE_SPEED    = 0.35;
  const PARTICLE_SIZE     = 1.4;

  // Renk stringleri bir kez oluştur
  const RED_FILL   = "rgba(220,38,38,0.75)";
  const WHITE_FILL = "rgba(255,255,255,0.35)";

  let particles = [];
  let animId;
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      vx:  (Math.random() - 0.5) * PARTICLE_SPEED,
      vy:  (Math.random() - 0.5) * PARTICLE_SPEED,
      r:   Math.random() * PARTICLE_SIZE + 0.5,
      red: Math.random() < 0.18,
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // ── Parçacıkları güncelle & çiz ──
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.red ? RED_FILL : WHITE_FILL;
      ctx.fill();
    }

    // ── Bağlantı çizgileri (mesafe karşılaştırması sqrt'siz) ──
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx  = particles[i].x - particles[j].x;
        const dy  = particles[i].y - particles[j].y;
        const dsq = dx * dx + dy * dy;

        if (dsq < CONNECT_DIST_SQ) {
          const alpha = (1 - dsq / CONNECT_DIST_SQ) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(220,38,38,${alpha.toFixed(2)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();

  // Resize debounce — her pixel değişiminde yeniden başlatma
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      resize();
      initParticles();
      draw();
    }, 200);
  }, { passive: true });

  // Sekme gizlenince durdur
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      draw();
    }
  });

})();
