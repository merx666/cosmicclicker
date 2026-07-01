---
description: Cosmic Clicker - Workflow Operacyjny i Deployment
---

# Cosmic Clicker — Instrukcje Operacyjne Agenta

## 1. Złote Zasady (Hard Constraints)

1. **BRAK LOKALNEGO KOMPILOWANIA:** Agent pod żadnym pozorem nie próbuje budować, renderować ani testować aplikacji w wirtualnym środowisku lokalnym (localhost/sandbox).
2. **BEZWZGLĘDNA PEWNOŚĆ KOMPILACJI:** Zanim jakikolwiek kod trafi na serwer, musi zostać w 100% zweryfikowany logicznie i składniowo. Kompilacja na serwerze **musi** przejść pomyślnie za pierwszym razem. Brak pewności = brak deploymentu.
3. **WYMOGI FRAMEWORKA (DLACZEGO?):** Powyższe zakazy to nie są subiektywne preferencje użytkownika, lecz ścisłe wymogi techniczne frameworków `minikit` oraz `idkit`. Wymagają one uwierzytelnionych, zaufanych domen oraz specyficznego ekosystemu uruchomieniowego. Testy poza serwerem docelowym są bezwartościowe.
4. **WYŁĄCZNY JĘZYK KOMUNIKACJI:** Wszystkie komunikaty, logi, prośby o autoryzację i odpowiedzi kierowane do użytkownika muszą być generowane **wyłącznie w języku polskim**.

---

## 2. Środowisko i Architektura Połączeń

Infrastruktura opiera się na jednym środowisku produkcyjnym.

* **Kanał dostępowy:** `ssh prod`
* **Produkcja (jedyne środowisko docelowe):** `void.skyreel.art`

Nie istnieje osobne środowisko testowe/stagingowe. Każdy deployment trafia bezpośrednio na produkcję.

---

## 3. Protokół Wdrażania (Deployment Pipeline)

### Faza 1: Pre-Flight Check (Weryfikacja Bezwzględna)

Zanim Agent zainicjuje połączenie SSH:

1. Przeprowadza rygorystyczną analizę kodu (linting, type-checking, walidacja importów z `minikit`/`idkit`).
2. Upewnia się, że konfiguracje adresów URL pasują do środowiska produkcyjnego (`void.skyreel.art`).
3. Jeśli występuje cień wątpliwości co do tego, czy build na serwerze przejdzie — Agent **zatrzymuje operację** i wskazuje użytkownikowi problem.

### Faza 2: Production Release

1. Agent łączy się przez `ssh prod` i wgrywa kod z targetem na `void.skyreel.art`.
2. Kompilacja odbywa się po stronie serwera.
3. Agent czeka na status z serwera, upewniając się, że aplikacja wstała poprawnie bez błędów integracji.
4. Agent raportuje w języku polskim udane zakończenie operacji.

---

## 4. Reagowanie na Błędy (Fail-Safe Protocol)

Jeśli kompilacja lub uruchomienie na serwerze zwróci błąd:

* Agent ma **całkowity zakaz** „zgadywania" i wdrażania na ślepo kolejnych poprawek przez SSH.
* Wymagany jest zrzut logów błędu do analizy, przemyślenie problemu, wprowadzenie korekty i ponowne przejście procedury od Fazy 1.

---

## 5. Integracja World ID (IDKit) — Protokół Implementacji

### 5.1 Dane uwierzytelniające (zmienne środowiskowe)

Credentiale aplikacji przechowywane są w zmiennych środowiskowych serwera:

| Zmienna | Opis | Zakres |
|---|---|---|
| `WORLD_APP_ID` | `app_id` z Developer Portal | frontend + backend |
| `WORLD_RP_ID` | `rp_id` z Developer Portal | frontend + backend |
| `RP_SIGNING_KEY` | Klucz podpisujący — **nigdy nie eksponować klientowi** | **tylko backend** |

### 5.2 Kroki integracji

1. **Instalacja SDK IDKit** dla odpowiedniej platformy.

2. **Endpoint backendowy — generowanie podpisu RP:**
   Podpis potwierdza, że żądanie proofa pochodzi z naszej aplikacji.

   ```ts
   import { signRequest } from '@worldcoin/idkit-core'

   const rpSignature = signRequest(
     'verify-human',             // action
     process.env.RP_SIGNING_KEY, // klucz prywatny — NIGDY na frontend
     // ttlSeconds opcjonalny, domyślnie 300
   )

   // Zwróć do frontendu:
   return {
     rp_id: process.env.WORLD_RP_ID,
     nonce: rpSignature.nonce,
     created_at: rpSignature.createdAt,
     expires_at: rpSignature.expiresAt,
     signature: rpSignature.sig,
   }
   ```

3. **Frontend — tworzenie żądania IDKit:**

   ```ts
   import { orbLegacy } from '@worldcoin/idkit-core'

   // Pobranie podpisu RP z backendu
   const rpContext = await fetch('/api/rp-signature').then(r => r.json())

   const request = await IDKit.request({
     app_id: process.env.WORLD_APP_ID,
     action: 'verify-human',
     allow_legacy_proofs: true,   // true = akceptuj v3 + v4 | false = tylko v4
     rp_context: rpContext,
   }).preset(orbLegacy({ signal: 'opcjonalny-user-id-lub-wallet' }))

   // Renderuj QR code
   console.log('Scan:', request.connectorURI)

   // Czekaj na wynik
   const completion = await request.pollUntilCompletion({
     pollInterval: 1000,
     timeout: 300000,
     signal: abortController.signal,
   })

   if (!completion.success) {
     console.error('Weryfikacja nieudana:', completion.error)
     return
   }

   // Wyślij proof do backendu
   await fetch('/api/verify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(completion.result),
   })
   ```

   > **Signal** jest opcjonalny — służy do powiązania kontekstu (np. user ID, adres portfela) z proofem. Backend powinien wymuszać tę samą wartość.

4. **Backend — weryfikacja proofa:**
   Payload z IDKit przesłać **bez remapowania pól** do:

   ```
   POST https://developer.world.org/api/v4/verify/{rp_id}
   ```

### 5.3 Dokumentacja referencyjna

Pełna dokumentacja World ID: `https://docs.world.org/llms.txt`

---

## 6. Kontekst Migracyjny World ID 4.0

Poniższe informacje stanowią tło techniczne, którym Agent powinien się kierować przy podejmowaniu decyzji implementacyjnych.

### 6.1 Timeline migracji

| Faza | Daty | Opis |
|---|---|---|
| **Faza 1** (Migracja) | do 1 maja 2026 | Upgrade SDK/kontraktów, rejestracja RP, tworzenie akcji v4. Nowi użytkownicy World App mają zarówno v3 jak i v4. |
| **Faza 2** (Przejście) | 1 maja 2026 → 31 marca 2027 | Nowi użytkownicy mogą tworzyć wyłącznie proofy 4.0. Wszyscy użytkownicy migrują do 4.0. |
| **Faza 3** (Odcięcie v3) | od 1 kwietnia 2027 | World App przestaje generować proofy v3. |

### 6.2 Kluczowe zmiany w protokole

* **Nowe typy credentiali** z możliwością żądania przez `all`, `any`, `enumerate`.
* **Proofy World ID bez World App** — generowanie proofów bezpośrednio w natywnej aplikacji RP.
* **Session Proofs** — nowy typ proofa umożliwiający weryfikację powracających użytkowników. `sessionId` zastępuje nullifier jako stabilny identyfikator.
* **Nullifiery jednorazowe** — aplikacje potrzebujące stabilnego identyfikatora powinny stosować Session Proofs.
* **Recovery** — użytkownicy v4 mogą odzyskać World ID po utracie autentykatorów. Użytkownicy v3 nie mają tej opcji bezpośrednio.
* **`genesis_issued_at`** — odnosi się do daty oryginalnego uzyskania credentialu (np. wizyty w Orbie), nie do daty upgrade'u do v4.

### 6.3 Ustawienie `allow_legacy_proofs`

* `true` — akceptuj zarówno proofy v3 jak i v4 (zalecane w fazie przejściowej).
* `false` — akceptuj wyłącznie proofy v4 (po fazie przejściowej).

### 6.4 Legacy Presets (zamienniki Verification Level)

Poziomy weryfikacji z 3.0 zostały zastąpione presetami:

* `orbLegacy()` — odpowiednik Orb verification level
* `secureDocumentLegacy()` — odpowiednik Secure Document
* `documentLegacy()` — odpowiednik Document

### 6.5 On-chain — uwagi migracyjne

Aplikacje on-chain wymagają nowych adresów kontraktów World ID 4.0. Podczas migracji nowy kontrakt powinien sprawdzać nullifiery zarówno ze starego jak i nowego kontraktu, aby zapobiec podwójnym claimom.

### 6.6 Session Proofs — tworzenie i weryfikacja sesji

Dla aplikacji wymagających powtarzalnej weryfikacji tego samego użytkownika:

1. **Utworzenie sesji** — `IDKit.createSession(...)` → zwraca `session_id` (zapisać!).
2. **Dowodzenie sesji** — `IDKit.proveSession(sessionId, ...)` → weryfikacja, że to ten sam użytkownik.

`session_id` jest stabilnym identyfikatorem na czas życia World ID użytkownika.

---

## 7. Dostępne endpointy API (skrócona referencja)

| Endpoint | Opis |
|---|---|
| `POST /api/v4/verify/{rp_id}` | Weryfikacja proofów World ID 4.0 i legacy 3.0 |
| `POST /api/v2/verify/{app_id}` | Weryfikacja legacy (tylko 3.0) |
| `GET /api/v1/prices` | Aktualne ceny tokenów |
| `GET /api/v1/transaction/{id}` | Status transakcji |
| `POST /api/v1/notify/{app_id}` | Wysyłanie notyfikacji do użytkowników mini app |

Pełna specyfikacja OpenAPI: `https://docs.world.org/openapi/developer-portal.json`