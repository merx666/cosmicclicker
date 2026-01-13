# 🚀 Deployment Instructions - Void Collector

## ✅ GOTOWE
- [x] Production build zakończony sukcesem
- [x] Environment variables skonfigurowane
- [x] MiniKit App ID: `app_e3c317455f168a14ab972dbe4f34ab9a`
- [x] Supabase credentials dodane

## 📋 KROK 1: Uruchom Migrację SQL na Supabase

**⚠️ WAŻNE:** Musisz uruchomić to SQL ręcznie w Supabase Dashboard!

### Instrukcje:
1. Idź na https://supabase.com/dashboard/project/wrruwhauyttrbgjrkcje
2. Zaloguj się do swojego konta
3. W lewym menu kliknij **"SQL Editor"**
4. Kliknij **"New Query"**
5. Skopiuj i wklej SQL poniżej:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id_nullifier TEXT UNIQUE NOT NULL,
  username TEXT,
  particles BIGINT DEFAULT 0,
  total_particles_collected BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  particles_per_click INT DEFAULT 1,
  particles_per_second INT DEFAULT 0,
  upgrade_click_power INT DEFAULT 1,
  upgrade_auto_collector INT DEFAULT 0,
  upgrade_multiplier INT DEFAULT 0,
  upgrade_offline INT DEFAULT 0,
  total_wld_claimed DECIMAL(18, 8) DEFAULT 0,
  last_claim_time TIMESTAMP,
  login_streak INT DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  reward_particles INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_nullifier ON users(world_id_nullifier);
CREATE INDEX idx_users_particles ON users(total_particles_collected DESC);
CREATE INDEX idx_missions_user ON missions(user_id, mission_type);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

6. Kliknij **"Run"** (zielony przycisk)
7. Sprawdź czy nie ma błędów (powinno być "Success")
8. Przejdź do **"Table Editor"** w menu i sprawdź czy masz tablice `users` i `missions`

### Po uruchomieniu migracji, powiedz mi "migracja gotowa" a zdeployuję aplikację! 🚀

---

## 🖥️ KROK 2: Deployment na void.skyreel.art (automatyczny po migracji)

Po tym jak uruchomisz migrację SQL, zdeploy aplikację na serwer:

```bash
# 1. SSH do serwera prod
ssh prod

# 2. Przejdź do katalogu aplikacji (lub utwórz)
cd /var/www/void-collector || mkdir -p /var/www/void-collector && cd /var/www/void-collector

# 3. Clone repo (jeśli nie ma)
# git clone your_repo_url .

# 4. Skopiuj pliki z local build
# (transfer .next/, package.json, node_modules)

# 5. Install PM2 (jeśli nie ma)
npm install -g pm2

# 6. Start aplikacji
pm2 start npm --name void-collector -- start
pm2 save

# 7. Setup nginx reverse proxy
# (config nginx dla void.skyreel.art → localhost:3000)
```

---

## ⚡ SZYBKA DROGA (Alternatywnie - Vercel)

Zamiast własnego serwera, mogę wdrożyć na **Vercel** (hosting Next.js):

```bash
npm install -g vercel
vercel --prod
# Podaj domain: void.skyreel.art
# Auto-deploy w 2 minuty!
```

**Pytanie:** Wolisz deploy na własny serwer (ssh prod) czy Vercel?

---

## 📦 Co jest w buildzie (.next/)

- Optimized production bundle
- Server routes (/api/verify-world-id, /api/game-state)
- Static assets skompilowane
- Wszystko gotowe do uruchomienia `npm start`

---

**Czekam na Twój feedback:**
1. Powiedz mi po uruchomieniu migracji SQL
2. Wybierz deployment method (ssh prod vs Vercel)
