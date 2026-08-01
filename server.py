"""
server.py — Hapsetme Sorgu Backend
────────────────────────────────────
Bu sunucu:
1. Cloudflare korumalı arastir.vip API'sine curl_cffi ile bağlanır
2. Siteden gelen CORS isteklerine izin verir
3. Flask ile çalışır

Kurulum:
    pip install flask flask-cors curl_cffi

Çalıştır:
    python server.py

Sunucu http://localhost:5000 üzerinde çalışır.
Siteyi de localde açarsan direkt bağlanır.

Deploy için: Railway / Render / Replit ücretsiz plan yeterli.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from curl_cffi import requests as cf_requests
import json

app = Flask(__name__)

# Tüm originlere izin ver (sitenden gelen istekler için)
CORS(app, origins="*")

# ── curl_cffi session (Chrome124 parmak izi) ──
_session = cf_requests.Session(impersonate="chrome124")

def cf_get(url: str):
    """Cloudflare korumalı URL'ye istek at."""
    try:
        r = _session.get(url, timeout=20)
        return r.text
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ── Proxy endpoint ──
@app.route("/proxy")
def proxy():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "url parametresi eksik"}), 400

    # Sadece arastir.vip'e izin ver (güvenlik)
    if "arastir.vip" not in url:
        return jsonify({"error": "İzin verilmeyen domain"}), 403

    result = cf_get(url)

    try:
        data = json.loads(result)
        return jsonify(data)
    except Exception:
        return result, 200, {"Content-Type": "application/json"}

@app.route("/")
def index():
    return jsonify({"status": "ok", "service": "Hapsetme Sorgu Backend"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    print(f"── Hapsetme Sorgu Backend başlatılıyor... ──")
    print(f"   http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
