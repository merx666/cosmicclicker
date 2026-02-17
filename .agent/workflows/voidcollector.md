---
description: Cosmic Clicker - Workflow Operacyjny i Deployment
---

# Projekt: Cosmic Clicker - Workflow Operacyjny i Deployment

## 1. Złote Zasady (Hard Constraints)
1. **BRAK LOKALNEGO KOMPILOWANIA:** Agent pod żadnym pozorem nie próbuje budować, renderować ani testować aplikacji w wirtualnym środowisku lokalnym (localhost/sandbox).
2. **BEZWZGLĘDNA PEWNOŚĆ KOMPILACJI:** Zanim jakikolwiek kod trafi na serwer, musi zostać w 100% zweryfikowany logicznie i składniowo. Kompilacja na serwerze **musi** przejść pomyślnie za pierwszym razem. Brak pewności = brak deploymentu.
3. **WYMOGI FRAMEWORKA (DLACZEGO?):** Powyższe zakazy to nie są subiektywne preferencje użytkownika, lecz ścisłe wymogi techniczne frameworków `minikit` oraz `idkit`. Wymagają one uwierzytelnionych, zaufanych domen oraz specyficznego ekosystemu uruchomieniowego. Testy poza serwerem docelowym są bezwartościowe.
4. **WYŁĄCZNY JĘZYK KOMUNIKACJI:** Wszystkie komunikaty, logi, prośby o autoryzację i odpowiedzi kierowane do użytkownika muszą być generowane **wyłącznie w języku polskim**.

---

## 2. Środowiska i Architektura Połączeń
Infrastruktura opiera się na dwóch adresach, dostępnych za pośrednictwem tego samego kanału dostępowego.

* **Kanał dostępowy dla obu środowisk:** `ssh prod`

* **Staging / Środowisko Testowe:**
  * Cel: Wrzutka w celu zweryfikowania działania aplikacji w boju i integracji z `minikit`/`idkit`.
  * Adres docelowy: `wld.skyreel.art`

* **Produkcja / Środowisko Docelowe:**
  * Cel: Wrzutka finalnego, sprawdzonego na Stagingu kodu.
  * Adres docelowy: `void.skyreel.art`

---

## 3. Protokół Wdrażania (Deployment Pipeline)

### Faza 1: Pre-Flight Check (Weryfikacja Bezwzględna)
Zanim Agent zainicjuje połączenie SSH:
1. Przeprowadza rygorystyczną analizę kodu (linting, type-checking, walidacja importów z `minikit`/`idkit`).
2. Upewnia się, że konfiguracje adresów URL pasują do środowiska docelowego.
3. Jeśli występuje cień wątpliwości co do tego, czy build na serwerze przejdzie – Agent zatrzymuje operację i wskazuje użytkownikowi problem.

### Faza 2: Test Deployment (Staging)
1. Wykonanie komendy deploymentu przez `ssh prod` z targetem na serwer testowy (`wld.skyreel.art`).
2. Po wrzuceniu plików kompilacja odbywa się po stronie serwera.
3. Agent czeka na status z serwera, upewniając się, że aplikacja wstała poprawnie bez rzucania błędami integracji.

### Faza 3: Production Release (Deployment Właściwy)
1. Wdrażanie na produkcję może nastąpić tylko po udanym teście na środowisku `wld.skyreel.art`.
2. Agent łączy się przez `ssh prod` i wgrywa kod z targetem na `void.skyreel.art`.
3. Agent raportuje w języku polskim udane zakończenie operacji.

---

## 4. Reagowanie na Błędy (Fail-Safe Protocol)
Jeśli kompilacja lub uruchomienie na serwerze zwróci błąd:
* Agent ma całkowity zakaz "zgadywania" i wdrażania na ślepo kolejnych poprawek przez SSH.
* Wymagany jest zrzut logów błędu do analizy lokalnej, przemyślenie problemu (zgodnie z profilem Ground_Control), wprowadzenie korekty i ponowne przejście procedury od Fazy 1.