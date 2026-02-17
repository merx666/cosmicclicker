# Ani Ads SDK - Implementation Guide

A simple guide for integrating Ani Ads into your Mini App.

## Installation

```bash
npm install ani-ads-sdk
# or
pnpm add ani-ads-sdk
```

## Usage

```tsx
import { AniAds } from 'ani-ads-sdk'

function MyApp() {
  return (
    <AniAds
      creator_wallet="0x..." 
      app_name="My App Name"
      user_wallet_address="0x..." 
    />
  )
}
```

## Props

- `creator_wallet` (string, required): Your creator wallet address registered on the Ani Ads platform
- `app_name` (string, required): The exact app name as registered on the Ani Ads platform
- `user_wallet_address` (string, required): The wallet address of the current user viewing your app


## How It Works

1. The SDK automatically fetches available ads from the Ani Ads API
2. Ads are displayed in a 400x100px banner format (4:1 aspect ratio)
3. When a user clicks an ad:
   - The click is tracked
   - Claim your Payment on Ani Ads Platform
   - The destination URL opens in a new tab

## Requirements

- React 18+ or React 19+
- `@worldcoin/minikit-js` >=1.9.6 (must be installed in your project as a peer dependency)
- A creator wallet address having the app name registered on the Ani Ads platform

**Important:** You must also install `@worldcoin/minikit-js` in your project:

```bash
npm install @worldcoin/minikit-js
# or
pnpm add @worldcoin/minikit-js
```

## Framework Configuration

### Vite

If you're using Vite, add this to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'], // Important: Prevents multiple React instances
  },
  optimizeDeps: {
    include: ['ani-ads-sdk'],
  },
})
```

### Next.js

The SDK works out-of-the-box with Next.js. Just make sure your component using `<AniAds>` has `"use client"` at the top of the file.

**Note:** Since React is now only a peer dependency, the SDK uses the same React instance as your Next.js project, which prevents conflicts and improves performance.

## Example

```tsx
import React from 'react'
import { AniAds } from 'ani-ads-sdk'

function MyMiniApp() {
  const userWallet = "0x1234..." // Get from your wallet connection
  const creatorWallet = "0x5678..." // Your creator wallet address
  const appName = "My Mini App" // Exact name as registered on Ani Ads platform
  
  return (
    <div>
      <h1>My Mini App</h1>
      <AniAds
        creator_wallet={creatorWallet}
        app_name={appName}
        user_wallet_address={userWallet}
      />
    </div>
  )
}