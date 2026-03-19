1. **Optimize Zustand subscriptions**
   The `GameScreen` component subscribes to the `particles` state from `useGameStore`. This value can update frequently, up to multiple times per second due to auto-collection and user clicks. Every time `particles` changes, the entire `GameScreen` component re-renders. This is unnecessary since `GameScreen` only uses `particles` to display the "💎 X WLD" balance in the header. We can extract this into a separate, small `HeaderBalance` component.
   Similarly, `ParticleCounter` also subscribes to `particles`, which causes it to re-render. This is correct as it displays the number, but re-rendering the whole `ParticleCounter` also re-renders its child divs.

   We will:
   - Create a new `HeaderBalance` component inside `components/HeaderBalance.tsx`.
   - Remove `const particles = useGameStore((state) => state.particles)` from `components/GameScreen.tsx` to stop `GameScreen` from re-rendering on every particle change.
   - Use `HeaderBalance` in `GameScreen`.
