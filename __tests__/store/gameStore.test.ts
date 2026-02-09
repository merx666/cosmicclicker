import { useGameStore } from '../../store/gameStore'

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
) as jest.Mock

describe('Game Store', () => {
    beforeEach(() => {
        // Reset store
        useGameStore.setState({
            particles: 0,
            particlesPerClick: 1,
            upgradeClickPower: 1,
            totalClicks: 0,
            vipTier: 0,
            totalParticlesCollected: 0
        })
        jest.clearAllMocks()
    })

    test('initial state', () => {
        const state = useGameStore.getState()
        expect(state.particles).toBe(0)
        expect(state.particlesPerClick).toBe(1)
    })

    test('handleClick increments particles', () => {
        const { handleClick } = useGameStore.getState()
        handleClick()

        const state = useGameStore.getState()
        expect(state.particles).toBe(1)
        expect(state.totalClicks).toBe(1)
    })

    test('handleClick respects particlesPerClick', () => {
        useGameStore.setState({ particlesPerClick: 5 })
        const { handleClick } = useGameStore.getState()
        handleClick()

        const state = useGameStore.getState()
        expect(state.particles).toBe(5)
    })

    test('purchaseUpgrade subtracts cost and upgrades', () => {
        useGameStore.setState({ particles: 200 })
        const { purchaseUpgrade } = useGameStore.getState()

        const success = purchaseUpgrade('click_power', 100, 2)
        const state = useGameStore.getState()

        expect(success).toBe(true)
        expect(state.particles).toBe(100) // 200 - 100
        expect(state.particlesPerClick).toBe(2)
        expect(state.upgradeClickPower).toBe(2)
    })

    test('purchaseUpgrade fails if not enough particles', () => {
        useGameStore.setState({ particles: 50 })
        const { purchaseUpgrade } = useGameStore.getState()

        const success = purchaseUpgrade('click_power', 100, 2)
        const state = useGameStore.getState()

        expect(success).toBe(false)
        expect(state.particles).toBe(50)
        expect(state.particlesPerClick).toBe(1)
    })

    test('VIP tier bonus calculation', () => {
        // Silver VIP (tier 2) adds +2 per click
        useGameStore.setState({ vipTier: 2, particlesPerClick: 1 })
        const { handleClick } = useGameStore.getState()

        handleClick()
        const state = useGameStore.getState()

        // 1 (base) + 2 (tier bonus) = 3
        expect(state.particles).toBe(3)
    })

    test('debouncedSave sets a timeout', () => {
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

        const { debouncedSave } = useGameStore.getState()

        debouncedSave()

        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)

        debouncedSave()

        // Second call should clear previous timeout
        expect(clearTimeoutSpy).toHaveBeenCalled()
        expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
    })
})
