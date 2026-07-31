/**
 * apis.js — Tüm API tanımlamaları.
 * apis.txt dosyasından manuel olarak parse edilen endpoint listesi.
 * Yeni API eklemek için bu diziye yeni bir obje ekleyin.
 */

const API_DEFINITIONS = [
  // ─── 1. TC Kimlik Sorgulama ───────────────────────────────────────────────
  {
    id: "tc-sorgu",
    name: "TC Kimlik Sorgulama",
    icon: "fa-solid fa-id-card",
    description: "TC kimlik numarasına göre ad, soyad, doğum tarihi, nüfus ili, anne ve baba bilgilerini getirir.",
    params: [
      {
        key: "tc",
        label: "TC Kimlik No",
        placeholder: "12345678901",
        type: "text",
        required: true,
        pattern: "\\d{11}",
        hint: "11 haneli TC kimlik numarası",
      },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/tc.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 2. Ad Soyad Sorgulama ────────────────────────────────────────────────
  {
    id: "adsoyad-sorgu",
    name: "Ad Soyad Sorgulama",
    icon: "fa-solid fa-user-magnifying-glass",
    description: "Ad ve soyad bilgisiyle kişi arama yapar. İl, ilçe, anne ve baba adı ile filtreleme desteklenir.",
    params: [
      { key: "ad",    label: "Ad",       placeholder: "AHMET",    type: "text", required: true,  hint: "Kişinin adı" },
      { key: "soyad", label: "Soyad",    placeholder: "YILMAZ",   type: "text", required: false, hint: "İsteğe bağlı" },
      { key: "il",    label: "İl",       placeholder: "ISTANBUL",  type: "text", required: false, hint: "İsteğe bağlı" },
      { key: "ilce",  label: "İlçe",     placeholder: "KADIKOY",  type: "text", required: false, hint: "İsteğe bağlı" },
      { key: "anne",  label: "Anne Adı", placeholder: "AYSE",     type: "text", required: false, hint: "İsteğe bağlı" },
      { key: "baba",  label: "Baba Adı", placeholder: "MEHMET",   type: "text", required: false, hint: "İsteğe bağlı" },
    ],
    buildUrl: (vals) => {
      const base = "https://arastir.vip/api/adsoyad.php";
      const p = new URLSearchParams();
      if (vals.ad)    p.append("ad",    vals.ad);
      if (vals.soyad) p.append("soyad", vals.soyad);
      if (vals.il)    p.append("il",    vals.il);
      if (vals.ilce)  p.append("ilce",  vals.ilce);
      if (vals.anne)  p.append("anne",  vals.anne);
      if (vals.baba)  p.append("baba",  vals.baba);
      return `${base}?${p.toString()}`;
    },
  },

  // ─── 3. Aile Sorgulama ────────────────────────────────────────────────────
  {
    id: "aile-sorgu",
    name: "Aile Sorgulama",
    icon: "fa-solid fa-people-roof",
    description: "TC kimlik numarasına göre anne, baba ve kardeş bilgilerini listeler.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/aile.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 4. Sülale Sorgulama ─────────────────────────────────────────────────
  {
    id: "sulale-sorgu",
    name: "Sülale Sorgulama",
    icon: "fa-solid fa-sitemap",
    description: "TC kimlik numarasına göre büyükanne, büyükbaba, teyze, dayı, amca ve hala bilgilerini getirir.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/sulale.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 5. Çocuk Sorgulama ──────────────────────────────────────────────────
  {
    id: "cocuk-sorgu",
    name: "Çocuk Sorgulama",
    icon: "fa-solid fa-child",
    description: "TC kimlik numarasına göre kayıtlı çocuk bilgilerini listeler.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/cocuk.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 6. Adres Sorgulama ───────────────────────────────────────────────────
  {
    id: "adres-sorgu",
    name: "Adres Sorgulama",
    icon: "fa-solid fa-location-dot",
    description: "TC kimlik numarasına göre ikametgah adresi ve vergi numarası bilgisini getirir.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/adres.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 7. GSM → TC Sorgulama ────────────────────────────────────────────────
  {
    id: "gsmtc-sorgu",
    name: "GSM → TC Sorgulama",
    icon: "fa-solid fa-mobile-screen-button",
    description: "Telefon numarasına göre kayıtlı TC kimlik numaralarını listeler.",
    params: [
      { key: "gsm", label: "GSM Numarası", placeholder: "05551234567", type: "tel", required: true, hint: "0 ile başlayan 11 haneli numara" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/gsmtc.php?gsm=${encodeURIComponent(vals.gsm)}`,
  },

  // ─── 8. TC → GSM Sorgulama ────────────────────────────────────────────────
  {
    id: "tcgsm-sorgu",
    name: "TC → GSM Sorgulama",
    icon: "fa-solid fa-phone-flip",
    description: "TC kimlik numarasına göre kayıtlı telefon numaralarını listeler.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/tcgsm.php?tc=${encodeURIComponent(vals.tc)}`,
  },

  // ─── 9. İşyeri Sorgulama ─────────────────────────────────────────────────
  {
    id: "isyeri-sorgu",
    name: "İşyeri Sorgulama",
    icon: "fa-solid fa-building",
    description: "TC kimlik numarasına göre SGK kayıtlı işyeri ve çalışma durumunu getirir.",
    params: [
      { key: "tc", label: "TC Kimlik No", placeholder: "12345678901", type: "text", required: true, pattern: "\\d{11}", hint: "11 haneli TC kimlik numarası" },
    ],
    buildUrl: (vals) => `https://arastir.vip/api/isyeri.php?tc=${encodeURIComponent(vals.tc)}`,
  },
];
