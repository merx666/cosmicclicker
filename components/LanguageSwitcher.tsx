'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { ChangeEvent, useTransition } from 'react'

export default function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value
        startTransition(() => {
            // Replace the locale in the pathname
            // pathname is like /en/some-path
            // we want /pl/some-path
            const segments = pathname.split('/')
            segments[1] = nextLocale
            const newPath = segments.join('/')
            router.replace(newPath)
        })
    }

    return (
        <div className="relative inline-block w-full text-void-gray">
            <select
                defaultValue={locale}
                className="block appearance-none w-full bg-void-purple/20 border border-void-purple/50 hover:border-void-purple px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline text-sm"
                onChange={onSelectChange}
                disabled={isPending}
            >
                <option value="en">🇺🇸 EN (English)</option>
                <option value="pl">🇵🇱 PL (Polski)</option>
                <option value="es">🇪🇸 ES (Español)</option>
                <option value="ru">🇷🇺 RU (Русский)</option>
                <option value="uk">🇺🇦 UK (Українська)</option>
                <option value="cs">🇨🇿 CS (Čeština)</option>
                <option value="sk">🇸🇰 SK (Slovenčina)</option>
                <option value="no">🇳🇴 NO (Norsk)</option>
                <option value="sv">🇸🇪 SV (Svenska)</option>
                <option value="th">🇹🇭 TH (ไทย)</option>
                <option value="id">🇮🇩 ID (Indonesian)</option>
                <option value="pt">🇧🇷 PT (Português)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-void-purple">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
        </div>
    )
}
