# 🌌 Cosmic Clicker

A **World App Mini-App** idle clicker game built for the Worldcoin ecosystem. Players collect void particles, upgrade their cosmic base, and compete on global leaderboards.

🔗 **Live Demo:** [void.skyreel.art](https://void.skyreel.art)

---

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Server Components
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety across the codebase
- **Tailwind CSS 4** - Utility-first styling with custom design tokens
- **Framer Motion** - Smooth animations and micro-interactions
- **Zustand** - Lightweight state management

### Backend & Infrastructure
- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL** - Self-hosted relational database
- **PM2** - Process manager for production deployment
- **Nginx** - Reverse proxy with SSL termination

### Web3 Integration
- **World ID MiniKit** - Authentication and payment processing via Worldcoin
- **WLD Token Payments** - In-app purchases using World Chain

---

## 🎮 Features

- **Idle Gameplay** - Automatic particle collection with upgradeable units
- **Daily Missions** - Reset at 00:00 UTC with reward system
- **Global Leaderboard** - Compete with players worldwide
- **Premium Store** - WLD token purchases for exclusive content
- **World ID Verification** - Optional Orb verification for bonus rewards
- **Responsive Design** - Optimized for mobile World App experience

---

## 🏗️ Architecture

```
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints (game-state, daily-stats, verify)
│   ├── layout.tsx         # Root layout with MiniKit provider
│   └── page.tsx           # Main game entry point
├── components/
│   ├── GameScreen.tsx     # Core game canvas
│   ├── VoidParticle.tsx   # Particle animation system
│   ├── tabs/              # Tab-based navigation (Home, Upgrades, Premium...)
│   ├── effects/           # Visual effects (background, particles)
│   └── providers/         # Context providers
├── store/
│   └── gameStore.ts       # Zustand global state
├── lib/                   # Utilities and database connection
└── supabase/
    └── migrations/        # PostgreSQL schema migrations
```

---

## 🔐 Security

- Environment variables for all sensitive data
- World ID verification for secure authentication
- Server-side validation for all game state changes
- Rate limiting on API endpoints

---

## 📊 Key Technical Decisions

| Challenge | Solution |
|-----------|----------|
| Real-time idle mechanics | Client-side timer with server sync on intervals |
| Payment integration | World MiniKit with tokenToDecimals conversion |
| State persistence | PostgreSQL with optimistic UI updates |
| Animation performance | Framer Motion with GPU-accelerated transforms |
| Daily mission reset | UTC-based server-side timestamp validation |

---

## 👨‍💻 Author

Built by [merx666](https://github.com/merx666)

---

## 📄 License

This project is proprietary software developed for the World App ecosystem.
