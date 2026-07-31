/**
 * config.js — Merkezi yapılandırma dosyası.
 * Discord linkini ve genel ayarları buradan değiştirin.
 */

const CONFIG = {
  // ─── Discord davet linkinizi buraya yapıştırın ───
  DISCORD_INVITE: "https://discord.com/invite/hapsetme",

  // ─── Site versiyonu ───
  VERSION: "1.0.0",

  // ─── Sorgu geçmişi için LocalStorage anahtarı ───
  HISTORY_KEY: "hapsetme_sorgu_history",

  // ─── Geçmişte tutulacak maksimum sorgu sayısı ───
  MAX_HISTORY: 20,

  // ─── Toplam sorgu sayacı için key ───
  COUNTER_KEY: "hapsetme_total_queries",

  // ─── API istek timeout süresi (ms) ───
  REQUEST_TIMEOUT: 15000,
};
