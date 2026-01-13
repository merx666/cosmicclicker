# VOID COLLECTOR - WorldApp Mini App Development Brief

## 🎯 Project Overview

Build a WorldApp Mini App called **"Void Collector"** - an idle clicker game where players collect "Void Particles" to earn WLD tokens. Inspired by the Void Bastion game universe.

**Deployment:** `void.skyreel.art`  
**Timeline:** 10-12 hours  
**Target Platform:** WorldApp Mini Apps (iOS/Android via WebView)

---

## 🌌 Concept & Theming

### Brand Alignment
- **Theme:** Space/Void aesthetic (matching Void Bastion)
- **Color Palette:** Dark purples, deep blues, cosmic blacks, glowing particles
- **Vibe:** Sci-fi, mysterious, cosmic energy collection
- **Assets:** Void particles (glowing purple/blue orbs floating in space)

### Why "Void" not "Orb"
- ORB is existing WorldCoin token/app (1-time claim per user lifetime)
- "Void" aligns with user's existing game brand (Void Bastion)
- Unique positioning in marketplace

---

## 🎮 Core Game Mechanics

### Primary Loop
1. **Click/Tap** → Collect Void Particles (with satisfying animations)
2. **Accumulate** → Particles stored in your Void Collector
3. **Upgrade** → Improve collection rate, passive income, multipliers
4. **Convert** → Exchange Particles → WLD tokens (periodic conversion)

### Idle Mechanics
- **Passive Collection:** Earn particles while offline (capped)
- **Auto-Collectors:** Upgradable passive income sources
- **Diminishing Returns:** Balance to prevent abuse

### Engagement Features
- **Daily Missions:** "Collect 1000 particles" → Bonus reward
- **Streak System:** Login daily for multiplier bonuses (1.1x → 2x)
- **Leaderboard:** Top collectors (weekly/all-time)
- **Achievements:** Unlock badges for milestones

---

## 🔐 World ID Integration (CRITICAL)

### Verification Flow
```
User opens app
  → MiniKit.install('app_id')
  → MiniKit.commandsAsync.walletAuth({ ... })
  → Verify World ID proof
  → Allow gameplay ONLY after verification
```

### Anti-Bot Features
- ✅ 1 account per verified human (World ID ensures uniqueness)
- ✅ No bot farming (proof of personhood required)
- ✅ Fair token distribution
- ✅ Rate limiting based on World ID

### Implementation Notes
- Store verification status in database (Supabase)
- Check `MiniKit.isInstalled()` before any game actions
- Handle verification failures gracefully
- Use World ID nullifier hash as unique user identifier

---

## 💰 Tokenomics & Rewards

### Particle → WLD Conversion
- **Exchange Rate:** 10,000 Particles = 0.01 WLD (adjustable)
- **Minimum Conversion:** 10,000 particles
- **Conversion Cooldown:** 24 hours per user
- **Daily Cap:** Max 0.1 WLD per user per day (prevent abuse)

### Smart Contract
- **Platform:** World Chain (Ethereum L2)
- **Type:** ERC20 token distribution contract
- **Features:**
  - Withdraw function (admin only)
  - Claim function (verified users only)
  - Rate limiting per World ID nullifier
  - Emergency pause functionality

### Contract Skeleton
```solidity
// VoidCollectorRewards.sol
contract VoidCollectorRewards {
    mapping(uint256 => uint256) public lastClaimTime; // nullifierHash => timestamp
    mapping(uint256 => uint256) public totalClaimed; // nullifierHash => amount
    
    uint256 public constant CLAIM_COOLDOWN = 24 hours;
    uint256 public constant MAX_DAILY_CLAIM = 0.1 ether; // 0.1 WLD
    
    function claimReward(
        uint256 nullifierHash,
        uint256 amount,
        bytes calldata proof
    ) external {
        // Verify World ID proof
        // Check cooldown
        // Transfer WLD
    }
}
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** TailwindCSS + custom CSS
- **Animations:** Framer Motion
- **State Management:** React Context + Zustand

### Backend/Database
- **Database:** Supabase (PostgreSQL)
  - User profiles (World ID nullifier → game state)
  - Particle balances
  - Upgrade levels
  - Leaderboard data
  - Transaction history
- **Auth:** World ID via MiniKit (server-side verification)

### Blockchain
- **Chain:** World Chain
- **SDK:** MiniKit-JS
- **Wallet Integration:** World App native wallet
- **Smart Contract:** Solidity 0.8.x, deployed via Hardhat/Foundry

### DevOps
- **Hosting:** Vercel (frontend) or VPS at void.skyreel.art
- **Domain:** void.skyreel.art
- **Tunneling (dev):** ngrok or Cloudflare Tunnel
- **CI/CD:** GitHub Actions (optional)

---

## 📱 UI/UX Design Specifications

### Layout Structure
```
┌─────────────────────────────┐
│  🌌 VOID COLLECTOR          │ ← Header (username, WLD balance)
├─────────────────────────────┤
│                             │
│     [VOID PARTICLE]         │ ← Main clickable area
│    (animated, glowing)      │   (70% of screen height)
│                             │
│   Particles: 1,234          │ ← Counter (animated increment)
├─────────────────────────────┤
│ [TAB: Collect] [Upgrades]   │ ← Navigation tabs
│  [Missions] [Leaderboard]   │
├─────────────────────────────┤
│  Auto-collect: 10/sec       │ ← Stats footer
│  Next conversion: 2h 15m    │
└─────────────────────────────┘
```

### Visual Elements

**Main Particle (Center Screen)**
- 3D-like glowing sphere with particle effects
- Pulsing animation (breathing effect)
- Click → Burst of smaller particles + haptic feedback
- Color: Purple/blue gradient with glow
- Size: Scales with upgrades (visual progression)

**Click Animation**
```javascript
onClick() {
  // Particle burst effect
  // +1 counter animation (flying text)
  // Haptic feedback: MiniKit.sendHapticFeedback('light')
  // Sound effect (optional, muted by default)
  // Glow intensity pulse
}
```

**Particle Counter**
- Large, prominent number
- CountUp animation on increment
- Suffix formatting (1.2K, 1.2M)
- Gradient text effect

**Background**
- Animated starfield/void effect
- Parallax scrolling on user interaction
- Dark theme (OLED-friendly)
- CSS `background: radial-gradient(circle, #1a0b2e 0%, #0a0415 100%)`

### Color Palette
```css
:root {
  --void-dark: #0a0415;
  --void-purple: #6b2fb5;
  --void-blue: #3d5af1;
  --particle-glow: #a855f7;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0b0;
  --success: #10b981;
  --warning: #f59e0b;
}
```

### Typography
- **Font:** Inter or Space Grotesk (cosmic vibe)
- **Headings:** Bold, large, dramatic
- **Numbers:** Tabular figures, monospace feel

### Micro-interactions
- ✅ Haptic feedback on every click (MiniKit API)
- ✅ Smooth transitions (300ms ease-in-out)
- ✅ Loading states (skeleton screens)
- ✅ Success animations (confetti on upgrade)
- ✅ Error handling (toast notifications)

---

## 🎯 Feature Specifications

### 1. COLLECT Tab (Main Screen)

**Elements:**
- Large particle visual (clickable)
- Particle counter
- Particles per click stat
- Auto-collection rate
- Next passive reward timer

**Actions:**
- Click particle → +1 (or +multiplier)
- Claim offline rewards (button appears if > 0)

**Logic:**
```typescript
interface GameState {
  particles: number;
  particlesPerClick: number;
  particlesPerSecond: number;
  clickMultiplier: number;
  lastClaimTime: number;
  totalClicks: number;
}

function handleClick() {
  const earned = particlesPerClick * clickMultiplier;
  particles += earned;
  totalClicks += 1;
  
  // Save to Supabase every 10 clicks (debounced)
  if (totalClicks % 10 === 0) {
    saveGameState();
  }
  
  // Trigger animations
  triggerParticleBurst();
  sendHapticFeedback();
}
```

### 2. UPGRADES Tab

**Upgrade Categories:**

**A. Click Power**
- Level 1: +1 per click (base)
- Level 2: +2 per click (cost: 100 particles)
- Level 3: +5 per click (cost: 500 particles)
- Level N: +N per click (cost: exponential)

**B. Auto-Collectors**
- "Void Drone" → 1 particle/sec (cost: 1000)
- "Gravity Well" → 5 particles/sec (cost: 10,000)
- "Black Hole" → 50 particles/sec (cost: 100,000)

**C. Multipliers**
- "Quantum Boost" → 1.5x all earnings (cost: 50,000)
- "Time Dilation" → 2x auto-collect (cost: 200,000)

**D. Special**
- "Offline Optimizer" → +50% offline earnings (cost: 75,000)
- "Lucky Void" → 10% chance double particles on click (cost: 150,000)

**UI:**
```
┌─────────────────────────────┐
│ 🚀 Click Power              │
│ Level 5 → Level 6           │
│ +5 per click → +6 per click │
│                             │
│ Cost: 2,500 particles       │
│ [UPGRADE] or [MAX LEVEL]    │
└─────────────────────────────┘
```

**Logic:**
- Exponential pricing: `baseCost * (1.15 ^ currentLevel)`
- Max levels to prevent inflation
- Visual feedback on purchase (confetti animation)

### 3. MISSIONS Tab

**Daily Missions (Reset at 00:00 UTC):**
- ✅ Collect 1,000 particles → +500 bonus
- ✅ Click 100 times → +200 bonus
- ✅ Reach 10K total → +1000 bonus
- ✅ Claim offline rewards → +300 bonus

**Weekly Missions:**
- Collect 50K particles total → +5000 bonus
- Login 7 days in a row → 2x multiplier for 1 day
- Reach level 10 in any upgrade → +10,000 bonus

**UI:**
```
┌─────────────────────────────┐
│ Daily Missions (2/4 done)   │
│                             │
│ ✅ Click 100 times          │
│ ✅ Collect 1,000 particles  │
│ ⬜ Reach 10K total (67%)    │
│ ⬜ Claim offline rewards    │
└─────────────────────────────┘
```

### 4. LEADERBOARD Tab

**Categories:**
- Top collectors (all-time particles)
- Top clickers (total clicks)
- Fastest to 1M particles

**UI:**
```
┌─────────────────────────────┐
│ 🏆 Top Collectors           │
│                             │
│ 1. 👤 Alice  1.2M particles │
│ 2. 👤 Bob    987K particles │
│ 3. 👤 You    856K particles │
│ ...                         │
└─────────────────────────────┘
```

**Implementation:**
- Supabase query with pagination
- Real-time updates every 60 seconds
- Show user's rank even if not in top 100

### 5. CONVERT Tab (Particles → WLD)

**UI:**
```
┌─────────────────────────────┐
│ 💰 Convert to WLD           │
│                             │
│ Your Particles: 45,678      │
│                             │
│ Exchange Rate:              │
│ 10,000 particles = 0.01 WLD │
│                             │
│ You can claim: 0.045 WLD    │
│                             │
│ [ CONVERT & CLAIM ]         │
│                             │
│ Cooldown: Ready! ✅         │
│ (or "Next claim in 12h 34m")│
└─────────────────────────────┘
```

**Logic:**
```typescript
async function convertToWLD(particles: number) {
  // 1. Check minimum (10,000)
  if (particles < 10000) {
    showError('Need at least 10,000 particles');
    return;
  }
  
  // 2. Check cooldown (24h)
  const timeSinceLastClaim = Date.now() - lastClaimTime;
  if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
    showError('Cooldown active');
    return;
  }
  
  // 3. Calculate WLD amount
  const wldAmount = (particles / 10000) * 0.01;
  
  // 4. Call smart contract
  const tx = await contract.claimReward(
    nullifierHash,
    wldAmount,
    worldIdProof
  );
  
  // 5. Update database
  await supabase.from('users').update({
    particles: particles - (Math.floor(particles / 10000) * 10000),
    totalClaimed: totalClaimed + wldAmount,
    lastClaimTime: Date.now()
  });
  
  // 6. Show success
  showSuccess(`Claimed ${wldAmount} WLD!`);
}
```

---

## 🗄️ Database Schema (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id_nullifier TEXT UNIQUE NOT NULL, -- World ID hash
  username TEXT, -- Optional display name
  particles BIGINT DEFAULT 0,
  total_particles_collected BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  particles_per_click INT DEFAULT 1,
  particles_per_second INT DEFAULT 0,
  
  -- Upgrades (store levels)
  upgrade_click_power INT DEFAULT 1,
  upgrade_auto_collector INT DEFAULT 0,
  upgrade_multiplier INT DEFAULT 0,
  upgrade_offline INT DEFAULT 0,
  
  -- Rewards
  total_wld_claimed DECIMAL(18, 8) DEFAULT 0,
  last_claim_time TIMESTAMP,
  
  -- Engagement
  login_streak INT DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard view (materialized for performance)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  username,
  total_particles_collected,
  total_clicks,
  ROW_NUMBER() OVER (ORDER BY total_particles_collected DESC) as rank
FROM users
ORDER BY total_particles_collected DESC
LIMIT 1000;

-- Missions table
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  mission_type TEXT, -- 'daily' | 'weekly'
  mission_id TEXT, -- 'collect_1000' etc
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  reward_particles INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_nullifier ON users(world_id_nullifier);
CREATE INDEX idx_users_particles ON users(total_particles_collected DESC);
CREATE INDEX idx_missions_user ON missions(user_id, mission_type);
```

---

## 🔧 Implementation Checklist

### Phase 1: Setup & Foundation (2 hours)
- [ ] Clone MiniKit Next.js 15 template
- [ ] Setup project structure (`/app`, `/components`, `/lib`, `/contracts`)
- [ ] Configure TypeScript + ESLint + Prettier
- [ ] Install dependencies: 
  - `@worldcoin/minikit-js`
  - `framer-motion`
  - `@supabase/supabase-js`
  - `zustand`
  - `react-hot-toast`
- [ ] Setup Supabase project + database schema
- [ ] Configure environment variables (`.env.local`)
- [ ] Setup void.skyreel.art subdomain + SSL

### Phase 2: World ID Integration (1 hour)
- [ ] Implement `MiniKitProvider` wrapper
- [ ] Create `useWorldID` hook
- [ ] Build verification flow UI
- [ ] Test World ID verification (use ngrok for mobile testing)
- [ ] Store nullifier hash in Supabase on successful verification

### Phase 3: Core Game UI (3 hours)
- [ ] Design + implement main layout (header, tabs, footer)
- [ ] Build particle visual (animated SVG or Canvas)
- [ ] Implement click handler with animations
- [ ] Add particle counter with CountUp effect
- [ ] Create haptic feedback integration
- [ ] Build background starfield effect
- [ ] Implement responsive design (mobile-first)

### Phase 4: Game Mechanics (2 hours)
- [ ] Build game state management (Zustand store)
- [ ] Implement click-to-earn logic
- [ ] Add passive/auto collection system
- [ ] Create offline rewards calculation
- [ ] Build upgrade system logic
- [ ] Add local storage persistence (backup)
- [ ] Sync game state to Supabase (debounced)

### Phase 5: Features (2 hours)
- [ ] Build UPGRADES tab + purchase logic
- [ ] Implement MISSIONS system (daily checks)
- [ ] Create LEADERBOARD with real-time updates
- [ ] Build CONVERT tab UI
- [ ] Add streak system (login bonuses)

### Phase 6: Smart Contract (1.5 hours)
- [ ] Write VoidCollectorRewards.sol
- [ ] Add World ID verification in contract
- [ ] Deploy to World Chain testnet
- [ ] Test claim flow end-to-end
- [ ] Deploy to mainnet (when ready)

### Phase 7: Polish & Testing (1.5 hours)
- [ ] Add loading states everywhere
- [ ] Implement error handling + toast notifications
- [ ] Add sound effects (optional, muted by default)
- [ ] Performance optimization (React.memo, useMemo)
- [ ] Mobile testing on actual WorldApp
- [ ] Fix any bugs found during testing
- [ ] Add analytics (optional: Vercel Analytics)

### Phase 8: Deployment & Submission (1 hour)
- [ ] Build for production (`next build`)
- [ ] Deploy to void.skyreel.art
- [ ] Test on live domain in WorldApp
- [ ] Create app listing in WorldApp Developer Portal
- [ ] Upload screenshots/demo video
- [ ] Write app description
- [ ] Submit for review
- [ ] Monitor for approval/feedback

---

## 🎨 Assets Needed

### Graphics
- Void particle (main clickable) - SVG or PNG with glow
- Background starfield - CSS or animated canvas
- Upgrade icons - Simple SVG icons for each upgrade type
- Achievement badges - Optional PNG/SVG

### Sound Effects (Optional)
- Click sound (soft "pop")
- Upgrade purchase (success chime)
- Particle burst (whoosh)
- All muted by default, toggle in settings

### Fonts
- Inter or Space Grotesk (Google Fonts)

**Note:** Generate missing assets with AI or use free resources (unDraw, Heroicons)

---

## 🚨 Critical Requirements (WorldApp Compliance)

### Must-Have for Approval
- ✅ World ID verification required to play
- ✅ Notifications limited to 1/day (if using notifications at all)
- ✅ No gambling/chance-based rewards (skill/time-based only)
- ✅ No token pre-sales or ICO mechanics
- ✅ Functional, not marketing-focused
- ✅ Mobile-first responsive design
- ✅ Clear privacy policy + terms of service
- ✅ No data collection beyond World ID

### Security Considerations
- Rate limiting on API endpoints
- Server-side World ID proof verification (never trust client)
- Input validation on all user actions
- SQL injection prevention (use Supabase parameterized queries)
- Smart contract auditing (or use simple, audited patterns)

---

## 🔗 Key Resources

### Documentation
- WorldApp MiniKit Docs: https://docs.world.org/mini-apps
- MiniKit-JS SDK: https://github.com/worldcoin/minikit-js
- World ID Integration: https://docs.world.org/world-id
- Supabase Docs: https://supabase.com/docs
- World Chain: https://worldchain.org

### Templates
- Next.js 15 Template: `https://github.com/worldcoin/minikit-template-next-15`

### Testing
- Use ngrok to expose localhost:3000 for mobile testing
- WorldApp Simulator (if available)
- Test with real World ID on staging

---

## 📊 Success Metrics (Post-Launch)

Track these KPIs:
- **DAU/MAU** - Daily/Monthly Active Users
- **Retention** - Day 1, Day 7, Day 30 retention rates
- **Engagement** - Avg clicks per session, session length
- **Conversion** - Particles → WLD claim rate
- **Virality** - Referral conversion (if implemented)

---

## 🎯 Final Deliverable

**What you're building:**
A WorldApp Mini App at `void.skyreel.art` where verified humans can:
1. Click to collect Void Particles (satisfying, addictive gameplay)
2. Upgrade collectors and multipliers
3. Complete daily missions for bonuses
4. Convert particles to WLD tokens (rate-limited, fair distribution)
5. Compete on leaderboards

**Unique selling points:**
- 🌌 Beautiful void/space aesthetic (brand alignment)
- 🔐 Bot-proof via World ID (fair gameplay)
- 💰 Real WLD rewards (not just points)
- 🎮 Idle mechanics (passive income + active clicking)
- 🏆 Social features (leaderboards, missions)

**Estimated total time:** 10-12 hours for MVP, 14-16 hours for polished version

---

## 🚀 START CODING PROMPT

```
Build a WorldApp Mini App called "Void Collector" deployed at void.skyreel.art.

Tech stack:
- Next.js 15 + TypeScript + TailwindCSS + Framer Motion
- MiniKit-JS for World ID integration
- Supabase for database
- World Chain smart contract for WLD rewards

Core features:
1. Main screen: Clickable animated void particle (purple/blue glow)
2. Click → earn particles (with burst animation + haptic feedback)
3. Upgrades tab: Buy click power, auto-collectors, multipliers
4. Missions tab: Daily/weekly challenges for bonus particles
5. Leaderboard: Top collectors ranking
6. Convert tab: Exchange particles → WLD (10K particles = 0.01 WLD, 24h cooldown)

World ID verification required before gameplay. One account per verified human.

Follow the detailed spec in void_collector_brief.md for exact implementation.

Design: Dark space theme, smooth animations, mobile-first, OLED-friendly.

Build it step by step, starting with project setup and World ID integration.
```

---

## ✅ You're Ready!

This brief contains everything needed to build Void Collector. Follow the implementation checklist sequentially. When stuck, refer back to specific sections.

**Good luck, and may the Void be with you!** 🌌✨
