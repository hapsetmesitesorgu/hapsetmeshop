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
import urllib.parse

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
    # b64 parametresi varsa decode et (% double-encode sorununu önler)
    b64 = request.args.get("b64")
    if b64:
        try:
            import base64
            url = base64.b64decode(b64).decode("utf-8")
        except Exception:
            return jsonify({"error": "Geçersiz b64 parametresi"}), 400
    else:
        url = request.args.get("url")

    if not url:
        return jsonify({"error": "url parametresi eksik"}), 400

    # Sadece izin verilen domainlere izin ver
    if "arastir.vip" not in url and "arastir-01.site" not in url:
        return jsonify({"error": "İzin verilmeyen domain"}), 403

    result = cf_get(url)

    try:
        data = json.loads(result)
        return jsonify(data)
    except Exception:
        return result, 200, {"Content-Type": "application/json"}

@app.route("/log/tr")
def log_tr():
    site = request.args.get("site")
    if not site:
        return jsonify({"error": "site parametresi eksik"}), 400
    try:
        r = _session.get(f"https://wazely.vercel.app/api/trlog?site={site}", timeout=25)
        try:
            return jsonify(json.loads(r.text))
        except Exception:
            return r.text, 200, {"Content-Type": "application/json"}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/log/global")
def log_global():
    domain = request.args.get("domain")
    if not domain:
        return jsonify({"error": "domain parametresi eksik"}), 400
    try:
        r = _session.get(f"https://wentyn.pythonanywhere.com/extract?domain={domain}", timeout=25)
        # Düz metin yanıt
        return r.text, 200, {"Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*"}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/discord/user/<user_id>")
def discord_user(user_id):
    """Discord kullanıcı bilgilerini getirir."""
    if not user_id.isdigit() or not (5 <= len(user_id) <= 30):
        return jsonify({"error": "Geçersiz kullanıcı ID"}), 400
    try:
        r = _session.get(
            f"https://discord-api-search.bbrraaggee.workers.dev/api/users/{user_id}",
            headers={"Origin": "https://discord-id-hub.info"},
            timeout=10
        )
        try:
            return jsonify(json.loads(r.text))
        except Exception:
            return r.text, r.status_code, {"Content-Type": "application/json"}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
