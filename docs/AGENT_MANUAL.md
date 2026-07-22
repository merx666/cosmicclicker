# CosmicClicker (Void Collector) - Podręcznik dla Agentów AI

Dokumentacja ta została wygenerowana, aby pomóc agentom AI w zrozumieniu struktury, architektury, mechanik oraz różnic między środowiskiem lokalnym a produkcyjnym w projekcie CosmicClicker.

## 1. Architektura i Technologie
- **Framework**: Next.js 16.1 (App Router) z React 19
- **Język**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **Stan (State Management)**: Zustand (`store/gameStore.ts`)
- **Baza danych**: Supabase (PostgreSQL) z migracjami
- **Silnik Gry**: Phaser 3 (komponenty w `components/Game/scenes/`)
- **Web3 / Krypto**: Worldcoin IDKit, MiniKit, Viem
- **Inne Integracje**: Telegram Mini Apps, Ani Ads SDK, Monetag, TinyAdz

## 2. Środowisko Produkcyjne (SSH `prod`)
- **Serwer**: 46.247.109.247 (użytkownik `root`)
- **Ścieżka na produkcji**: `/var/www/void-collector`
- **PM2 Process**: `void-collector` (ID: 3) uruchomiony na porcie `3000` (`.next/standalone/server.js`)
- **Nginx**: Ruch z `void.skyreel.art` jest kierowany na `localhost:3000` (HTTPS). Subdomena `voidnext.skyreel.art` kieruje na `localhost:3006`.
- **Wdrożenie (Deployment)**: Realizowane za pomocą skryptu `deploy.sh` (uruchamia `npm install --production`, następnie startuje przez `pm2`).

## 3. Różnice między repozytorium (Lokalnie) a Produkcją
Agent musi mieć świadomość, że repozytorium różni się w pewnych aspektach od kodu, który aktualnie działa na produkcji.

**Główne różnice w plikach źródłowych:**
1. **Reklamy (`components/DynamicAdRotator.tsx`)**:
   - Lokalnie: Zmienna `CONST_MONETAG_WEIGHT` wynosi `0.5`, odświeżanie co 45s.
   - Produkcja: `CONST_MONETAG_WEIGHT` wynosi `0.0` (Monetag wyłączone, 100% TinyAdz), odświeżanie skrócone do 15s. Zmodyfikowano też renderowanie kontenerów TinyAdz.
2. **Skrypty w `app/[locale]/layout.tsx`**:
   - Produkcja wyłącza skrypt Monetag Vignette i ładuje globalnie skrypt TinyAdz (`https://cdn.apitiny.net/scripts/v2.0/main.js`).
3. **Balans Gry (`components/ParticleCounter.tsx`)**:
   - Lokalnie: `energyLimit` to `5000`.
   - Produkcja: `energyLimit` zmniejszone do `1000`.
4. **Interfejs Gry (`components/GameScreen.tsx`)**:
   - Zmiany w wyświetlaniu konwersji cząstek na WLD (próg `150000` zamiast `10000`).
5. **Poprawki w TypeScript (`components/Game/scenes/*`)**:
   - Produkcja posiada liczne poprawki typowania (zmiana `// @ts-ignore` na `// @ts-expect-error missing type`) oraz naprawione błędy lintowania w `MainScene.ts`, `TowerDefenseScene.ts`.
6. **Dodatkowe skrypty na produkcji**:
   - Migracje jednorazowe, zrzuty bazy (`backups/void_backup_*.sql`), skrypty developerskie (`check_env_user.js`, katalog `scratch/`, `julessesion/`).

## 4. API Endpoints (Katalog `app/api/`)
Backend opiera się na Route Handlers w Next.js. Kluczowe obszary to:

- **Gra i Stan**: `game-state`, `energy`, `leaderboard`, `daily-stats`, `void-block`
- **Sklep i Ulepszenia**: `shop`, `purchase-tier`, `purchase-wld-upgrade`, `rewards`
- **Web3 / Krypto**: `convert-wld`, `verify-world-id`, `payout`, `pay`, `initiate-payment`
- **Marketing / Reklamy**: `purchase-ad`, `generate-banner-content`
- **Autoryzacja i Sesje**: `auth`, `nonce`, `user`, `telegram`, `verify-void`
- **Administracja**: `admin`

## 5. Baza Danych (Supabase Migrations)
Struktura bazy przeszła 9 etapów migracji (od `001_initial_schema.sql` do `009_roulette_spins.sql`). Kluczowe tabele / funkcje dodawane podczas rozwoju:
1. Podstawowy schemat (użytkownicy, stany gier).
2. Pola premium (VIP).
3. Śledzenie pasywnych cząstek i dziennych konwersji.
4. Misje dzienne.
5. Żądania wypłat (Withdrawal requests).
6. Tiers (VIP/Premium) i powiązane adresy portfeli.
7. Historia zakupów tierów.
8. Dynamiczne stawki konwersji.
9. Ruletka / losowania.

## 6. Mechaniki Gry (Phaser 3)
Główny komponent integrujący grę to `GameScreen.tsx`. Kod silnika znajduje się w `components/Game/scenes/`:
- **MainScene.ts / TowerDefenseScene.ts**: Mechanika obrony bazy. Przeciwnicy poruszają się w kierunku bazy (Bastionu), gracz buduje wieżyczki (np. sniper, rapid, spread), wieżyczki automatycznie celują i strzelają. Gra wykorzystuje system radarów i "Void Shield". Posiada zarządzanie falami (waves).
- **SpaceScene.ts**: Inny tryb z poruszającym się statkiem/graczem w przestrzeni kosmicznej.

Zarządzanie stanem zewnętrznym (poza płótnem Phasera) jest kontrolowane przez `store/gameStore.ts` z wykorzystaniem biblioteki Zustand. Stan jest synchronizowany z bazą za pomocą żądań API wywoływanych przez `lib/services/gameService.ts`.

## 7. i18n
Aplikacja wspiera internacjonalizację (katalog `i18n/`, `messages/`). Wszystkie trasy aplikacji są wewnątrz struktury `app/[locale]/`.

## Wytyczne dla Agentów:
- Pamiętaj, aby zawsze operować na plikach lokalnych (`/Users/merx/void/cosmicclicker`), ale sprawdzaj ewentualne konflikty z logiką na produkcji jeśli robisz deployment.
- Przy wdrażaniu zmian związanych z balansem (limity energii, przeliczniki WLD) miej na uwadze, że produkcja posiada inne stałe zaszyte na twardo.
- Podczas tworzenia nowych komponentów używaj Tailwind CSS i upewniaj się, że są responsywne (gra działa często z poziomu Telegram Mini Apps - weryfikuje to warunek `isTelegram`).
