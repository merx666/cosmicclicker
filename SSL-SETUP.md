# 🔒 SSL Configuration - void.skyreel.art

## ⚠️ Problem: Cloudflare Proxy blokuje Certbot

**Wykryty problem:**
- DNS void.skyreel.art wskazuje na Cloudflare IPs (104.21.74.67)
- Certbot nie może zweryfikować domeny (error 520)
- Cloudflare proxy jest włączony (orange cloud)

## ✅ Rozwiązanie: 2 opcje

### Opcja 1: Wyłącz Cloudflare Proxy (ZALECANE dla Certbot)

1. Idź do Cloudflare Dashboard → DNS settings
2. Znajdź rekord `void.skyreel.art`
3. Kliknij pomarańczową chmur kę → zmień na **szarą** (DNS only)
4. Poczekaj 1-2 minuty na propagację DNS
5. Uruchom ponownie:
   ```bash
   ssh prod
   sudo certbot --nginx -d void.skyreel.art --non-interactive --agree-tos --email admin@skyreel.art --redirect
   ```
6. Po uzyskaniu certyfikatu możesz **włączyć z powrotem** Cloudflare proxy

### Opcja 2: Użyj Cloudflare Origin Certificate

1. Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate
3. Skopiuj certyfikat i klucz prywatny
4. Na serwerze:
   ```bash
   ssh prod
   sudo nano /etc/ssl/certs/cloudflare-origin.pem  # wklej certyfikat
   sudo nano /etc/ssl/private/cloudflare-origin.key  # wklej klucz
   ```
5. Aktualizuj Nginx config:
   ```nginx
   server {
       listen 443 ssl;
       server_name void.skyreel.art;
       
       ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
       ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
       
       # ... reszta config
   }
   ```

### Opcja 3: Pomiń SSL tymczasowo (HTTP only)

Nginx już działa na HTTP. Możesz testować aplikację na:
- http://void.skyreel.art (bez SSL, Cloudflare może redirect do HTTPS)

SSL dodamy później.

---

## 🚀 Current Status

✅ **Gotowe:**
- Nginx skonfigurowany
- Reverse proxy działa (port 80 → localhost:3000)
- DNS wskazuje na serwer (przez Cloudflare)

⏳ **Do zrobienia:**
- Uruchomić aplikację PM2 (ecosystem.config.js naprawiony)
- Wybrać metodę SSL (Opcja 1 lub 2)
- Test end-to-end

---

**Następny krok:** Powiedz mi którą opcję  SSL wybrać, a tymczasem uruchomię aplikację PM2!
