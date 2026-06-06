export enum TextAnimation {
    NONE = 'none',
    BLINK = 'blink',
    PULSE = 'pulse',
    GLITCH = 'glitch',
    SHAKE = 'shake'
}

export enum BorderAnimation {
    NONE = 'none',
    SOLID = 'solid',
    MARQUEE = 'marquee',
    FLASH = 'flash'
}

export enum TransitionType {
    NONE = 'none',
    FLASH_WHITE = 'flash_white',
    BLACKOUT = 'blackout'
}

export interface Slide {
    id: string;
    headline: string;
    subtext: string;

    // Colors
    bgColor: string;
    headlineColor: string;
    subtextColor: string;
    borderColor: string;

    backgroundImage?: string;

    // Animations
    headlineAnimation: TextAnimation;
    subtextAnimation: TextAnimation;
    borderAnimation: BorderAnimation;
    transitionType: TransitionType;

    duration: number;
}

export interface BannerSettings {
    width: number;
    height: number;
}

export enum GeneratorStatus {
    IDLE,
    GENERATING_TEXT,
    GENERATING_IMAGE,
    RENDERING_GIF,
    SUCCESS,
    ERROR
}
