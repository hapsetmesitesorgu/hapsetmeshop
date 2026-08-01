/**
 * app.js — Ana uygulama mantığı.
 * API kartlarını oluşturur, sorguları yönetir, Discord bağlantısı.
 */

/* ═══════════════════════════════════════════
   CORS PROXY FALLBACK SİSTEMİ
   Sırayla dener, ilk başarılı olanı kullanır.
═══════════════════════════════════════════ */

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * URL'yi CORS proxy'leri sırayla deneyerek çeker.
 * Her proxy için ayrı timeout uygulanır.
 * @param {string} targetUrl — Hedef API URL'si
 * @param {number} perProxyTimeout — Her proxy için ms cinsinden timeout
 * @returns {Promise<any>} — Parse edilmiş JSON verisi
 */
async function fetchWithFallback(targetUrl, perProxyTimeout = 8000) {
  let lastError;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl   = CORS_PROXIES[i](targetUrl);
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), perProxyTimeout);

    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();

      // allorigins wrapper formatı: { contents: "..." }
      let parsed;
      try {
        const outer = JSON.parse(text);
        // allorigins ve benzeri wrapper'lar
        if (outer && typeof outer.contents === "string") {
          parsed = JSON.parse(outer.contents);
        } else if (outer && outer.contents !== undefined) {
          parsed = outer.contents;
        } else {
          // corsproxy.io ve codetabs direkt JSON döner
          parsed = outer;
        }
      } catch {
        // Düz metin ise olduğu gibi döndür
        parsed = text;
      }

      return parsed;

    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // Sonraki proxy'ye geç
      console.warn(`Proxy ${i + 1} başarısız, sonraki deneniyor...`, err.message);
    }
  }

  // Tüm proxy'ler başarısız
  throw lastError || new Error("Tüm proxy'ler başarısız.");
}

/* ═══════════════════════════════════════════
   ANA SORGU FONKSİYONU
═══════════════════════════════════════════ */

/**
 * Verilen API id'sine ait karttan değerleri okur,
 * API isteği atar ve sonucu render eder.
 * @param {string} apiId
 */
async function queryApi(apiId) {
  const apiDef = API_DEFINITIONS.find((a) => a.id === apiId);
  if (!apiDef) return;

  // ── Parametre değerlerini topla ──
  const vals = {};
  let hasError = false;

  apiDef.params.forEach((p) => {
    const input = document.getElementById(`${apiId}-${p.key}`);
    const val   = input ? input.value.trim() : "";

    if (p.required && !val) {
      input.classList.add("input-error");
      showToast(`"${p.label}" alanı zorunludur.`, "error");
      hasError = true;
    } else {
      input && input.classList.remove("input-error");
      vals[p.key] = val;
    }
  });

  if (hasError) return;

  // ── URL oluştur ──
  const url = apiDef.buildUrl(vals);

  // ── Loading başlat ──
  setLoadingState(apiId, true);

  // Önceki sonucu kapat
  const resultContainer = document.getElementById(`result-${apiId}`);
  resultContainer.classList.remove("visible", "result-success", "result-error");
  resultContainer.style.maxHeight = "0";

  const startTime = performance.now();

  try {
    const data    = await fetchWithFallback(url, 8000);
    const elapsed = Math.round(performance.now() - startTime);

    // ── Başarılı ──
    renderResult(apiId, data, "success", elapsed);
    incrementQueryCounter();

    // Geçmişe ekle — ilk required parametrenin değerini kullan
    const firstReq = apiDef.params.find((p) => p.required);
    addToHistory(apiDef.name, firstReq ? vals[firstReq.key] : "—");

    showToast("Sorgu başarıyla tamamlandı!", "success");

  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);

    const message = err.name === "AbortError"
      ? { error: "Zaman aşımı.", details: "Tüm proxy'ler yanıt vermedi. Tekrar deneyin." }
      : { error: "Sorgu başarısız.", details: err.message };

    renderResult(apiId, message, "error", elapsed);
    showToast("Sorgu başarısız. Tekrar deneyin.", "error");
  } finally {
    setLoadingState(apiId, false);
  }
}

/* ═══════════════════════════════════════════
   KART GRID'İNİ OLUŞTUR
═══════════════════════════════════════════ */

function buildApiGrid() {
  const grid = document.getElementById("api-grid");
  if (!grid) return;

  API_DEFINITIONS.forEach((api, index) => {
    const card = createApiCard(api);
    // Staggered animasyon gecikmesi
    card.style.animationDelay = `${index * 80}ms`;
    grid.appendChild(card);
  });

  // API sayısını güncelle
  const countEl = document.getElementById("api-count");
  if (countEl) countEl.textContent = API_DEFINITIONS.length;
}

/* ═══════════════════════════════════════════
   DISCORD
═══════════════════════════════════════════ */

function initDiscord() {
  // Navbar ve footer Discord butonları
  ["discord-btn", "footer-discord"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(CONFIG.DISCORD_INVITE, "_blank", "noopener,noreferrer");
    });
  });
}

/* ═══════════════════════════════════════════
   UYGULAMA BAŞLATICI
═══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Preloader
  hidePreloader();

  // 2. API kartlarını oluştur
  buildApiGrid();

  // 3. Navbar, hamburger, smooth scroll
  initNavbar();
  initHamburger();
  initSmoothScroll();

  // 4. Discord
  initDiscord();

  // 5. Geçmişi yükle
  renderHistory();
  loadQueryCounter();

  // 6. Geçmişi temizle butonu
  const clearHistBtn = document.getElementById("clear-history-btn");
  if (clearHistBtn) clearHistBtn.addEventListener("click", clearHistory);

  // 7. Scroll reveal animasyonları
  // Küçük gecikmeyle başlat (DOM settle)
  setTimeout(initScrollReveal, 100);

  // 8. Arama kutusu
  initSearch();

  // 9. Favoriler yükle (kart oluşunca badge'leri güncelle)
  setTimeout(() => {
    getFavorites().forEach(updateFavBtn);
    renderFavoritesSection();
  }, 50);
});
