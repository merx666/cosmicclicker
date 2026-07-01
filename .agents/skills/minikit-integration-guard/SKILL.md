---
name: minikit-integration-guard
description: Validate and enforce safe implementation guidelines when working with World ID, MiniKit-js, and IDKit.
risk: safe
source: "project-local"
date_added: "2026-06-27"
---

# MiniKit & World ID Integration Guard

Ensure integration with World ID and World App MiniKit-js follows known-safe project conventions and avoids native app crashes, typing conflicts, or authentication handshake failures.

## When to Use

Use this skill whenever you are:
- Modifying code relating to `MiniKit`, `IDKit`, or `WorldID`.
- Implementing or updating payment actions via `MiniKit.pay`.
- Adjusting wallet authentication, SIWE (Sign-In with Ethereum), or the World ID verification handshake.
- Updating dependencies in `package.json` that include `viem`, `wagmi`, `@worldcoin/minikit-js`, or `@worldcoin/idkit`.

## Guardrails & Rules

### 1. Payment Verification (`MiniKit.pay`)
World App natively parses payment commands and is highly strict about parameter formats.
- **Reference Parameter:** The `reference` parameter **must** be a valid UUID. Using custom alphanumeric strings (e.g., custom transaction IDs) will cause the native World App to crash.
  * *Correct Pattern:*
    ```typescript
    const reference = crypto.randomUUID();
    // Pass this UUID to MiniKit.pay
    ```
- **Token Amount:** The `token_amount` parameter **must** be representable as a base-unit integer string (wei) rather than a float string. For example, `0.5 WLD` must be specified as `"500000000000000000"` (18 decimals) to prevent native BigInt conversion failures in the World App.
  * *Correct Pattern:*
    ```typescript
    const token_amount = "500000000000000000"; // 0.5 WLD in wei
    ```

### 2. Dependency Constraints (`package.json`)
- **Viem Version Pinning:** To prevent typing incompatibilities between `@worldcoin/minikit-js` (which internally depends on specific `viem` versions) and React/Vue hooks, **always pin `viem` to version `2.47.6`** in `package.json`.
  * *Enforcement:* Do not upgrade `viem` beyond `2.47.6` without checking for compatibility.

### 3. World ID Handshake & Staging IDs
- **Staging / Production IDs:** The `app_id` passed to `MiniKit.install()` or `IDKit.request()` must match the environment. For staging handshakes, use the established staging ID (e.g., `app_staging_f023f8` in `src/voidnext.ts`).
- **RP Signature Verification (Backend vs Frontend):**
  - **Private Key Isolation:** The `RP_SIGNING_KEY` private key **must never** be exposed to the client or checked into the frontend repository. It must only reside in backend environment variables.
  - The frontend should fetch the signature from `/api/rp-signature` and pass the returned context (`rp_id`, `nonce`, `created_at`, `expires_at`, `signature`) to `IDKit.request`.

### 4. Cache-Busting & PWA Service Workers
- Because World App Webview heavily caches assets, any frontend updates should include aggressive service worker unregistration scripts (e.g., in `index.html`) to ensure the client immediately pulls the new version (e.g., `Next Wallet v1.0.4` or newer).
