/**
 * ui.js — Kullanıcı arayüzü yardımcı fonksiyonları.
 * Toast, kart oluşturma, sonuç render, geçmiş vb.
 */

/* ═══════════════════════════════════════════
   TOAST BİLDİRİM SİSTEMİ
═══════════════════════════════════════════ */

/**
 * Ekranda kısa süreli bildirim gösterir.
 * @param {string} message — Gösterilecek mesaj
 * @param {'success'|'error'|'info'|'warning'} type — Bildirim türü
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "fa-circle-check",
    error:   "fa-circle-xmark",
    info:    "fa-circle-info",
    warning: "fa-triangle-exclamation",
  };

  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  // Giriş animasyonu
  requestAnimationFrame(() => toast.classList.add("show"));

  // Otomatik kapat
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3500);
}

/* ═══════════════════════════════════════════
   API KART OLUŞTURUCU
═══════════════════════════════════════════ */

/**
 * API tanımından HTML kart elementi üretir.
 * @param {object} api — API_DEFINITIONS dizisinden bir obje
 * @returns {HTMLElement}
 */
function createApiCard(api) {
  const card = document.createElement("div");
  card.className = "api-card fade-in-up";
  card.id = `card-${api.id}`;

  // Parametre input alanlarını oluştur
  const paramsHtml = api.params.map((p) => `
    <div class="param-group">
      <label class="param-label" for="${api.id}-${p.key}">
        ${p.label}
        ${p.required ? '<span class="required-star">*</span>' : '<span class="optional-badge">isteğe bağlı</span>'}
      </label>
      <div class="input-wrapper">
        <input
          class="param-input"
          id="${api.id}-${p.key}"
          type="${p.type || "text"}"
          placeholder="${p.placeholder || ""}"
          data-key="${p.key}"
          data-api="${api.id}"
          ${p.required ? "required" : ""}
          ${p.pattern ? `pattern="${p.pattern}"` : ""}
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      ${p.hint ? `<span class="param-hint">${p.hint}</span>` : ""}
    </div>
  `).join("");

  card.innerHTML = `
    <!-- Kart Başlığı -->
    <div class="card-header">
      <div class="card-title-row">
        <div class="card-icon"><i class="${api.icon}"></i></div>
        <div>
          <h3 class="card-name">${api.name}</h3>
        </div>
      </div>
      <div class="card-status" id="status-${api.id}">
        <div class="status-dot online"></div>
        <span>Online</span>
      </div>
    </div>

    <!-- Açıklama -->
    <p class="card-desc">${api.description}</p>

    <!-- Parametreler -->
    <div class="card-params" id="params-${api.id}">
      ${paramsHtml}
    </div>

    <!-- Butonlar -->
    <div class="card-actions">
      <button class="btn-query" id="btn-query-${api.id}" onclick="queryApi('${api.id}')">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>Sorgula</span>
        <div class="btn-glow"></div>
      </button>
      <button class="btn-clear" onclick="clearCard('${api.id}')">
        <i class="fa-solid fa-rotate-left"></i>
        <span>Temizle</span>
      </button>
    </div>

    <!-- Sonuç Alanı (başlangıçta gizli) -->
    <div class="result-container" id="result-${api.id}">
      <div class="result-header">
        <span class="result-title"><i class="fa-solid fa-terminal"></i> Sonuç</span>
        <div class="result-actions">
          <span class="result-time" id="result-time-${api.id}"></span>
          <button class="btn-copy" onclick="copyResult('${api.id}')" title="Kopyala">
            <i class="fa-solid fa-copy"></i>
            <span>Kopyala</span>
          </button>
        </div>
      </div>
      <pre class="result-body" id="result-body-${api.id}"></pre>
    </div>
  `;

  // Her inputta Enter ile sorgu tetikle
  card.querySelectorAll(".param-input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") queryApi(api.id);
    });
  });

  return card;
}

/* ═══════════════════════════════════════════
   SONUÇ RENDER
═══════════════════════════════════════════ */

/**
 * API yanıtını kart içindeki sonuç kutusuna render eder.
 * @param {string} apiId
 * @param {object|string} data — Yanıt verisi
 * @param {'success'|'error'} status
 * @param {number} ms — Geçen süre (milisaniye)
 */
function renderResult(apiId, data, status, ms) {
  const container = document.getElementById(`result-${apiId}`);
  const body      = document.getElementById(`result-body-${apiId}`);
  const timeEl    = document.getElementById(`result-time-${apiId}`);

  // JSON'u güzelleştirerek göster
  const formatted = typeof data === "string"
    ? data
    : JSON.stringify(data, null, 2);

  body.textContent = formatted;
  timeEl.textContent = `${ms}ms`;

  // Renk sınıflarını sıfırla
  container.classList.remove("result-success", "result-error", "hidden");
  container.classList.add(status === "success" ? "result-success" : "result-error");

  // Açılış animasyonu
  container.style.maxHeight = "0";
  container.classList.add("visible");
  requestAnimationFrame(() => {
    container.style.maxHeight = container.scrollHeight + "px";
  });

  // Syntax highlighting (basit, hafif)
  applySyntaxHighlight(body);
}

/**
 * JSON içeriğine basit renklendirme uygular.
 * @param {HTMLElement} el
 */
function applySyntaxHighlight(el) {
  const text = el.textContent;
  el.innerHTML = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"]+)"(\s*:)/g, '<span class="json-key">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span class="json-str">"$1"</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g,       ': <span class="json-null">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-num">$1</span>');
}

/* ═══════════════════════════════════════════
   LOADING DURUMU
═══════════════════════════════════════════ */

/**
 * Sorgu butonunu yüklenme durumuna alır.
 * @param {string} apiId
 * @param {boolean} loading
 */
function setLoadingState(apiId, loading) {
  const btn = document.getElementById(`btn-query-${apiId}`);
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="spinner"></span>
      <span>Sorgulanıyor...</span>
      <div class="btn-glow"></div>
    `;
    btn.classList.add("loading");
  } else {
    btn.disabled = false;
    btn.innerHTML = `
      <i class="fa-solid fa-magnifying-glass"></i>
      <span>Sorgula</span>
      <div class="btn-glow"></div>
    `;
    btn.classList.remove("loading");
  }
}

/* ═══════════════════════════════════════════
   KOPYALAMA
═══════════════════════════════════════════ */

/**
 * Sonuç kutusundaki içeriği panoya kopyalar.
 * @param {string} apiId
 */
function copyResult(apiId) {
  const body = document.getElementById(`result-body-${apiId}`);
  if (!body || !body.textContent.trim()) {
    showToast("Kopyalanacak içerik bulunamadı.", "warning");
    return;
  }

  navigator.clipboard.writeText(body.textContent)
    .then(() => showToast("Sonuç panoya kopyalandı!", "success"))
    .catch(() => {
      // Fallback: eski yöntem
      const ta = document.createElement("textarea");
      ta.value = body.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Sonuç panoya kopyalandı!", "success");
    });
}

/* ═══════════════════════════════════════════
   KARTI TEMİZLE
═══════════════════════════════════════════ */

/**
 * Kartın input alanlarını ve sonuç kutusunu sıfırlar.
 * @param {string} apiId
 */
function clearCard(apiId) {
  const card = document.getElementById(`card-${apiId}`);
  if (!card) return;

  card.querySelectorAll(".param-input").forEach((i) => (i.value = ""));

  const result = document.getElementById(`result-${apiId}`);
  result.classList.remove("visible", "result-success", "result-error");
  result.style.maxHeight = "0";

  // İlk inputa odaklan
  const first = card.querySelector(".param-input");
  if (first) first.focus();
}

/* ═══════════════════════════════════════════
   ARAMA GEÇMİŞİ
═══════════════════════════════════════════ */

/**
 * Geçmişe yeni kayıt ekler.
 * @param {string} apiName
 * @param {string} query — Sorgulanan değer
 */
function addToHistory(apiName, query) {
  const history = getHistory();
  history.unshift({ apiName, query, time: new Date().toLocaleString("tr-TR") });

  // Maksimum kayıt sayısını aşma
  if (history.length > CONFIG.MAX_HISTORY) history.pop();

  localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const list    = document.getElementById("recent-list");
  const history = getHistory();

  if (!history.length) {
    list.innerHTML = '<p class="empty-recent">Henüz sorgu yapılmadı.</p>';
    return;
  }

  list.innerHTML = history.map((item) => `
    <div class="recent-item fade-in-up">
      <div class="recent-info">
        <span class="recent-api">${item.apiName}</span>
        <span class="recent-query">${item.query}</span>
      </div>
      <span class="recent-time">${item.time}</span>
    </div>
  `).join("");
}

/**
 * Geçmişi temizler.
 */
function clearHistory() {
  localStorage.removeItem(CONFIG.HISTORY_KEY);
  renderHistory();
  showToast("Sorgu geçmişi temizlendi.", "info");
}

/* ═══════════════════════════════════════════
   TOPLAM SORGU SAYACI
═══════════════════════════════════════════ */

function incrementQueryCounter() {
  const current = parseInt(localStorage.getItem(CONFIG.COUNTER_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(CONFIG.COUNTER_KEY, next);
  const el = document.getElementById("query-count");
  if (el) animateCounter(el, current, next);
}

function loadQueryCounter() {
  const val = parseInt(localStorage.getItem(CONFIG.COUNTER_KEY) || "0", 10);
  const el  = document.getElementById("query-count");
  if (el) el.textContent = val;
}

/**
 * Sayı animasyonu ile değeri artırır.
 */
function animateCounter(el, from, to) {
  const duration = 600;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(from + (to - from) * progress);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════
   NAVBAR SCROLL EFEKTİ
═══════════════════════════════════════════ */

function initNavbar() {
  const navbar = document.getElementById("navbar");
  const links  = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    // Navbar blur efekti
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // Active link
    let current = "";
    sections.forEach((s) => {
      if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute("id");
    });

    links.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) link.classList.add("active");
    });
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   HAMBURGER MENÜ
═══════════════════════════════════════════ */

function initHamburger() {
  const btn   = document.getElementById("hamburger");
  const links = document.getElementById("nav-links");

  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    links.classList.toggle("open");
  });

  // Menü linkine tıklayınca kapat
  links.querySelectorAll(".nav-link").forEach((l) => {
    l.addEventListener("click", () => {
      btn.classList.remove("open");
      links.classList.remove("open");
    });
  });
}

/* ═══════════════════════════════════════════
   INTERSECTION OBSERVER (Fade-in)
═══════════════════════════════════════════ */

function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════════
   PRELOADER
═══════════════════════════════════════════ */

function hidePreloader() {
  const pl = document.getElementById("preloader");
  if (!pl) return;

  setTimeout(() => {
    pl.classList.add("hide");
    pl.addEventListener("transitionend", () => pl.remove(), { once: true });
  }, 1200);
}

/* ═══════════════════════════════════════════
   SMOOTH SCROLL
═══════════════════════════════════════════ */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
