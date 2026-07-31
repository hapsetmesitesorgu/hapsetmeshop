/**
 * particles.js — Hero bölümündeki canvas parçacık animasyonu.
 * Performans odaklı: requestAnimationFrame, düşük parçacık sayısı.
 */

(function () {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // ── Ayarlar ──
  const PARTICLE_COUNT = 60;
  const CONNECT_DISTANCE = 130;
  const PARTICLE_SPEED = 0.4;
  const PARTICLE_SIZE  = 1.5;
  const COLOR_PRIMARY  = "rgba(220, 38, 38,"; // kırmızı
  const COLOR_DIM      = "rgba(255, 255, 255,";

  let particles = [];
  let animId;

  // ── Canvas boyutunu güncelle ──
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  // ── Parçacık fabrikası ──
  function createParticle() {
    return {
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * PARTICLE_SPEED,
      vy: (Math.random() - 0.5) * PARTICLE_SPEED,
      r:  Math.random() * PARTICLE_SIZE + 0.5,
      // Bazı parçacıklar kırmızı, çoğu beyaz
      red: Math.random() < 0.2,
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  // ── Animasyon döngüsü ──
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Her parçacığı güncelle ve çiz
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Kenarlardan sekme
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // Nokta çiz
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.red
        ? `${COLOR_PRIMARY}0.8)`
        : `${COLOR_DIM}0.4)`;
      ctx.fill();
    });

    // Yakın parçacıklar arasına çizgi çek
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  // ── Başlat ──
  resize();
  initParticles();
  draw();

  // ── Resize dinle ──
  window.addEventListener("resize", () => {
    cancelAnimationFrame(animId);
    resize();
    initParticles();
    draw();
  }, { passive: true });

  // ── Sayfa görünür değilken animasyonu durdur (pil/CPU tasarrufu) ──
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      draw();
    }
  });

})();
