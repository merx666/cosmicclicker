import { Slide, TextAnimation, BorderAnimation, TransitionType } from './types';

export const DEFAULT_SLIDE: Slide = {
    id: 'init-1',
    headline: 'PURE QUALITY',
    subtext: 'ESCROW | NO LOGS',
    bgColor: '#000000',
    headlineColor: '#ccff00', // Lime green
    subtextColor: '#ffffff', // White
    borderColor: '#ccff00',
    headlineAnimation: TextAnimation.NONE,
    subtextAnimation: TextAnimation.NONE,
    borderAnimation: BorderAnimation.SOLID,
    transitionType: TransitionType.NONE,
    duration: 2.0,
};

// Removed MOCK_BACKGROUNDS and Models as we handle them in services/page logic
