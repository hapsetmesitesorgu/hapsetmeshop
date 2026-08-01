/**
 * security.js — Caydırıcı güvenlik önlemleri.
 * NOT: Bu önlemler yalnızca kullanıcı deneyimi seviyesinde caydırıcıdır.
 * Deneyimli kullanıcılar tarafından atlatılabilir.
 */

(function () {
  "use strict";

  // ── Sağ tık menüsünü devre dışı bırak ──
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // ── Klavye kısayollarını engelle ──
  document.addEventListener("keydown", (e) => {
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    // F12
    if (key === "F12") {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (Kaynak görüntüle)
    if (ctrl && key === "u") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I (DevTools)
    if (ctrl && shift && key === "I") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+J (Console)
    if (ctrl && shift && key === "J") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+C (Inspect Element)
    if (ctrl && shift && key === "C") {
      e.preventDefault();
      return false;
    }

    // Ctrl+S (Kaydet)
    if (ctrl && key === "s") {
      e.preventDefault();
      return false;
    }

    // Ctrl+A (Tümünü Seç) — İsteğe bağlı olarak etkin
    // if (ctrl && key === "a") { e.preventDefault(); return false; }
  });

  // ── DevTools açılma tespiti ──
  // Pencere boyutu farkını kontrol eder
  let devtools = false;

  function checkDevTools() {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!devtools) {
        devtools = true;
        // İsteğe bağlı: Kullanıcıyı uyar veya sayfayı yenile
        // console.clear();
      }
    } else {
      devtools = false;
    }
  }

  setInterval(checkDevTools, 1000);

  // ── console.log üzerine yaz ──
  // Caydırıcı uyarı mesajı
  const _warn = console.warn.bind(console);
  const _log  = console.log.bind(console);

  console.log = function (...args) {
    _log("%c⚠ Dur!", "color:#ff3333;font-size:24px;font-weight:bold;");
    _log("%cBu tarayıcı aracı kötü niyetli kişiler tarafından kullanılmaktadır.", "color:#ff3333;font-size:14px;");
  };

  // ── Metin seçimini kısıtla ──
  // Tamamen devre dışı bırakmak için aşağıdaki satırı açın:
  // document.body.style.userSelect = "none";
  // document.body.style.webkitUserSelect = "none";

})();
