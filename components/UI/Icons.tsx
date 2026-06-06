'use client'

import React from 'react'

interface IconProps {
    className?: string
    size?: number
}

// Sword/Battle Icon
export const SwordIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M20.5 3L3.5 20L6 22.5L8.5 20L11 22.5L13.5 20L16 22.5L18.5 20L21 22.5L20.5 3Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M20 3L3 20M6 20L4 22M11 20L9 22M16 20L14 22M21 20L19 22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="17" cy="6" r="2" fill="currentColor" />
    </svg>
)

// Shield/Armory Icon
export const ShieldIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2L4 6V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V6L12 2Z"
            fill="currentColor"
            opacity="0.2"
        />
        <path
            d="M12 2L4 6V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V6L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 8V16M9 12H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

// Skull/Hard Icon
export const SkullIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2C8 2 5 5 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5 16 2 12 2Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M12 2C8 2 5 5 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5 16 2 12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="9" r="1.5" fill="currentColor" />
        <path d="M10 14L12 12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V20H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Crown/Insane Icon
export const CrownIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Close Icon
export const CloseIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// Trophy/Rank Icon
export const TrophyIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M8 3H16V9C16 11.21 14.21 13 12 13C9.79 13 8 11.21 8 9V3Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M6 5H4C3.45 5 3 5.45 3 6V7C3 8.66 4.34 10 6 10H7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M18 5H20C20.55 5 21 5.45 21 6V7C21 8.66 19.66 10 18 10H17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M8 3H16V9C16 11.21 14.21 13 12 13C9.79 13 8 11.21 8 9V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 13V17M9 21H15M10 17H14V21H10V17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// Chart/Leaderboard Icon
export const ChartIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="3" y="14" width="4" height="7" fill="currentColor" opacity="0.3" rx="1" />
        <rect x="10" y="8" width="4" height="13" fill="currentColor" opacity="0.5" rx="1" />
        <rect x="17" y="3" width="4" height="18" fill="currentColor" opacity="0.7" rx="1" />
        <rect x="3" y="14" width="4" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
        <rect x="10" y="8" width="4" height="13" stroke="currentColor" strokeWidth="2" rx="1" />
        <rect x="17" y="3" width="4" height="18" stroke="currentColor" strokeWidth="2" rx="1" />
    </svg>
)

// Lightning/Energy Icon
export const LightningIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// People/Multiplayer Icon
export const PeopleIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="9" cy="7" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="17" cy="7" r="3" fill="currentColor" opacity="0.3" />
        <path
            d="M9 14C6.33 14 1 15.34 1 18V20H17V18C17 15.34 11.67 14 9 14Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M17 14C16.47 14 15.84 14.07 15.14 14.18C16.27 15.08 17 16.28 17 18V20H23V18C23 15.34 19.67 14 17 14Z"
            fill="currentColor"
            opacity="0.5"
        />
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
)

// Tank Unit Icon
export const TankIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="6" y="10" width="12" height="8" rx="2" fill="currentColor" opacity="0.3" />
        <rect x="8" y="6" width="8" height="4" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="6" y="10" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="8" y="6" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
        <circle cx="9" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        <circle cx="15" cy="18" r="1.5" fill="currentColor" />
        <line x1="16" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Assassin/Spectre Unit Icon
export const AssassinIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2L16 8L12 14L8 8L12 2Z"
            fill="currentColor"
            opacity="0.3"
        />
        <path
            d="M12 2L16 8L12 14L8 8L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M8 12L6 18H18L16 12"
            fill="currentColor"
            opacity="0.2"
        />
        <path
            d="M8 12L6 18H18L16 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="6" r="1" fill="currentColor" />
        <line x1="12" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Ranger/Valkyrie Unit Icon
export const RangerIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M2 12L12 2L22 12L12 22L2 12Z"
            fill="currentColor"
            opacity="0.2"
        />
        <path
            d="M2 12L12 2L22 12L12 22L2 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
)

// World/Globe Icon
export const WorldIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
            d="M3 12H21M12 3C13.5 3 15 5.5 15 12C15 18.5 13.5 21 12 21C10.5 21 9 18.5 9 12C9 5.5 10.5 3 12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M7 8C8.5 7 10 6.5 12 6.5C14 6.5 15.5 7 17 8M7 16C8.5 17 10 17.5 12 17.5C14 17.5 15.5 17 17 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

// User/Guest Icon
export const UserIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.3" />
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
            d="M6 20C6 16.69 8.69 14 12 14C15.31 14 18 16.69 18 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

// Lock Icon
export const LockIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" opacity="0.3" />
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
        <path
            d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
)

// Star Icon (for ratings, upgrades)
export const StarIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
        />
    </svg>
)

// Mage/Archmage Icon (replaces 🔮)
export const MageIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="10" r="6" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4L14 8L12 12L10 8L12 4Z" fill="currentColor" opacity="0.4" />
        <circle cx="10" cy="9" r="1" fill="currentColor" />
        <circle cx="14" cy="9" r="1" fill="currentColor" />
        <path d="M12 14V18M10 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Healer Icon (replaces 💚)
export const HealerIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 4.5C9.5 4.5 7.5 6.5 7.5 9C7.5 12 12 17 12 17C12 17 16.5 12 16.5 9C16.5 6.5 14.5 4.5 12 4.5Z" fill="currentColor" opacity="0.3" />
        <path d="M12 4.5C9.5 4.5 7.5 6.5 7.5 9C7.5 12 12 17 12 17C12 17 16.5 12 16.5 9C16.5 6.5 14.5 4.5 12 4.5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7V11M10 9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Warrior Icon (replaces ⚔️)
export const WarriorIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L9 5L7 8H17L15 5L12 2Z" fill="currentColor" opacity="0.3" />
        <rect x="8" y="8" width="8" height="10" rx="1" fill="currentColor" opacity="0.2" />
        <rect x="8" y="8" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M10 18V22M14 18V22M9 22H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// Fortress Icon (replaces 🏰)
export const FortressIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="10" width="16" height="12" fill="currentColor" opacity="0.2" />
        <rect x="4" y="10" width="16" height="12" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="6" width="4" height="4" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="6" width="4" height="4" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="15" width="4" height="7" stroke="currentColor" strokeWidth="2" />
    </svg>
)

// Necromancer Icon (replaces 💀)
export const NecromancerIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3C8.5 3 6 5.5 6 9C6 11 7 12.5 8.5 13.5V16C8.5 16.5 9 17 9.5 17H14.5C15 17 15.5 16.5 15.5 16V13.5C17 12.5 18 11 18 9C18 5.5 15.5 3 12 3Z" fill="currentColor" opacity="0.3" />
        <path d="M12 3C8.5 3 6 5.5 6 9C6 11 7 12.5 8.5 13.5V16C8.5 16.5 9 17 9.5 17H14.5C15 17 15.5 16.5 15.5 16V13.5C17 12.5 18 11 18 9C18 5.5 15.5 3 12 3Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="9.5" cy="8.5" r="1" fill="currentColor" />
        <circle cx="14.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
)

// Blade Icon
export const BladeIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 18L18 6M6 18L9 21L21 9L18 6L6 18Z" fill="currentColor" opacity="0.2" />
        <path d="M6 18L18 6M6 18L9 21L21 9L18 6" stroke="currentColor" strokeWidth="2" />
    </svg>
)

// Electro Icon
export const ElectroIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" opacity="0.3" />
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
)

// Paladin Icon  
export const PaladinIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L4 6V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V6L12 2Z" fill="currentColor" opacity="0.2" />
        <path d="M12 2L4 6V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V6L12 2Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
)

// Heart Icon
export const HeartIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 21C12 21 3.5 15 3.5 9.5C3.5 6 6 4 8.5 4C10 4 11.5 5 12 6C12.5 5 14 4 15.5 4C18 4 20.5 6 20.5 9.5C20.5 15 12 21 12 21Z" fill="currentColor" />
    </svg>
)

// Target Icon
export const TargetIcon = ({ className = '', size = 24 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

