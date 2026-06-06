'use client'

import { useState, useEffect, useCallback } from 'react'

export type Language = 'en' | 'pl' | 'de' | 'tr' | 'th' | 'es'

const translations: Record<string, Record<Language, string>> = {
    // === VERIFICATION SCREEN ===
    'verification.title': {
        en: 'VOID BASTION', pl: 'VOID BASTION', de: 'VOID BASTION',
        tr: 'VOID BASTION', th: 'VOID BASTION', es: 'VOID BASTION',
    },
    'verification.subtitle': {
        en: 'TACTICAL DEFENSE', pl: 'TAKTYCZNA OBRONA', de: 'TAKTISCHE VERTEIDIGUNG',
        tr: 'TAKTİK SAVUNMA', th: 'การป้องกันเชิงยุทธวิธี', es: 'DEFENSA TÁCTICA',
    },
    'verification.worldid_title': {
        en: 'World ID Verification', pl: 'Weryfikacja World ID', de: 'World ID Verifizierung',
        tr: 'World ID Doğrulama', th: 'ยืนยัน World ID', es: 'Verificación World ID',
    },
    'verification.worldid_desc': {
        en: 'Verify your identity to start the game',
        pl: 'Zweryfikuj tożsamość, aby rozpocząć grę',
        de: 'Verifiziere deine Identität, um zu spielen',
        tr: 'Oyuna başlamak için kimliğinizi doğrulayın',
        th: 'ยืนยันตัวตนเพื่อเริ่มเกม',
        es: 'Verifica tu identidad para jugar',
    },
    'verification.verify_btn': {
        en: 'Verify with World ID', pl: 'Zweryfikuj przez World ID', de: 'Mit World ID verifizieren',
        tr: 'World ID ile Doğrula', th: 'ยืนยันด้วย World ID', es: 'Verificar con World ID',
    },
    'verification.verifying': {
        en: 'VERIFYING...', pl: 'WERYFIKACJA...', de: 'VERIFIZIERUNG...',
        tr: 'DOĞRULANIYOR...', th: 'กำลังยืนยัน...', es: 'VERIFICANDO...',
    },
    'verification.secure': {
        en: '🔒 Secure verification via WorldApp',
        pl: '🔒 Bezpieczna weryfikacja przez WorldApp',
        de: '🔒 Sichere Verifizierung über WorldApp',
        tr: '🔒 WorldApp ile güvenli doğrulama',
        th: '🔒 ยืนยันอย่างปลอดภัยผ่าน WorldApp',
        es: '🔒 Verificación segura via WorldApp',
    },
    'verification.privacy': {
        en: 'Your privacy is protected',
        pl: 'Twoja prywatność jest chroniona',
        de: 'Deine Privatsphäre ist geschützt',
        tr: 'Gizliliğiniz korunmaktadır',
        th: 'ความเป็นส่วนตัวของคุณได้รับการคุ้มครอง',
        es: 'Tu privacidad está protegida',
    },
    'verification.required': {
        en: 'WorldApp required', pl: 'Wymagana aplikacja WorldApp', de: 'WorldApp erforderlich',
        tr: 'WorldApp gerekli', th: 'ต้องใช้ WorldApp', es: 'Se requiere WorldApp',
    },

    // === GAME LOBBY ===
    'lobby.highest_wave': {
        en: 'Highest Wave', pl: 'Najwyższa Fala', de: 'Höchste Welle',
        tr: 'En Yüksek Dalga', th: 'คลื่นสูงสุด', es: 'Ola Más Alta',
    },
    'lobby.credits': {
        en: 'Credits', pl: 'Kredyty', de: 'Credits',
        tr: 'Kredi', th: 'เครดิต', es: 'Créditos',
    },
    'lobby.play': {
        en: 'PLAY', pl: 'GRAJ', de: 'SPIELEN',
        tr: 'OYNA', th: 'เล่น', es: 'JUGAR',
    },
    'lobby.mode': {
        en: 'Mode: Tactical Defense', pl: 'Tryb: Taktyka Obrony', de: 'Modus: Taktische Verteidigung',
        tr: 'Mod: Taktik Savunma', th: 'โหมด: การป้องกันเชิงยุทธวิธี', es: 'Modo: Defensa Táctica',
    },
    'lobby.mode_desc': {
        en: 'Defend the Bastion against enemy waves',
        pl: 'Bronij Bastionu przed falami wrogów',
        de: 'Verteidige die Bastion gegen Feindwellen',
        tr: 'Kaleyi düşman dalgalarına karşı savunun',
        th: 'ปกป้องฐานจากคลื่นศัตรู',
        es: 'Defiende el Bastión contra oleadas enemigas',
    },

    // === NAVIGATION ===
    'nav.armory': {
        en: 'Armory', pl: 'Zbrojownia', de: 'Arsenal',
        tr: 'Cephanelik', th: 'คลังอาวุธ', es: 'Armería',
    },
    'nav.guide': {
        en: 'Guide', pl: 'Poradnik', de: 'Anleitung',
        tr: 'Rehber', th: 'คู่มือ', es: 'Guía',
    },
    'nav.multiplay': {
        en: 'Multiplay', pl: 'Multi', de: 'Multi',
        tr: 'Çoklu', th: 'หลายผู้เล่น', es: 'Multi',
    },
    'nav.ranking': {
        en: 'Ranking', pl: 'Ranking', de: 'Rangliste',
        tr: 'Sıralama', th: 'อันดับ', es: 'Ranking',
    },

    // === SHOP ===
    'shop.title': {
        en: 'CYBER ARMORY', pl: 'CYBER ZBROJOWNIA', de: 'CYBER ARSENAL',
        tr: 'SİBER CEPHANELİK', th: 'คลังอาวุธไซเบอร์', es: 'ARMERÍA CYBER',
    },
    'shop.towers': {
        en: 'Towers', pl: 'Wieże', de: 'Türme',
        tr: 'Kuleler', th: 'หอคอย', es: 'Torres',
    },
    'shop.consumables': {
        en: 'Items', pl: 'Przedmioty', de: 'Gegenstände',
        tr: 'Eşyalar', th: 'ไอเทม', es: 'Objetos',
    },
    'shop.skins': {
        en: 'Skins', pl: 'Skiny', de: 'Skins',
        tr: 'Görünümler', th: 'สกิน', es: 'Skins',
    },
    'shop.bundles': {
        en: 'Bundles', pl: 'Pakiety', de: 'Pakete',
        tr: 'Paketler', th: 'แพ็คเกจ', es: 'Paquetes',
    },
    'shop.buy_now': {
        en: 'BUY NOW', pl: 'KUP TERAZ', de: 'JETZT KAUFEN',
        tr: 'SATIN AL', th: 'ซื้อเลย', es: 'COMPRAR',
    },
    'shop.owned': {
        en: 'OWNED', pl: 'POSIADANE', de: 'BESITZT',
        tr: 'SAHIP', th: 'มีแล้ว', es: 'ADQUIRIDO',
    },
    'shop.processing': {
        en: 'PROCESSING...', pl: 'PRZETWARZANIE...', de: 'VERARBEITUNG...',
        tr: 'İŞLENİYOR...', th: 'กำลังดำเนินการ...', es: 'PROCESANDO...',
    },
    'shop.footer1': {
        en: 'Transactions via World Chain.',
        pl: 'Transakcje przez World Chain.',
        de: 'Transaktionen über World Chain.',
        tr: 'World Chain üzerinden işlemler.',
        th: 'ธุรกรรมผ่าน World Chain',
        es: 'Transacciones vía World Chain.',
    },
    'shop.footer2': {
        en: 'Use your WLD balance or top up via World App.',
        pl: 'Użyj salda WLD lub doładuj przez World App.',
        de: 'Nutze dein WLD-Guthaben oder lade über World App auf.',
        tr: 'WLD bakiyenizi kullanın veya World App ile yükleyin.',
        th: 'ใช้ยอด WLD หรือเติมเงินผ่าน World App',
        es: 'Usa tu saldo WLD o recarga vía World App.',
    },
    'shop.flash_sale': {
        en: '🔥 FLASH SALE ACTIVE', pl: '🔥 BŁYSKAWICZNA WYPRZEDAŻ', de: '🔥 BLITZVERKAUF AKTIV',
        tr: '🔥 FLAŞ İNDİRİM', th: '🔥 ลดราคาแฟลช', es: '🔥 VENTA FLASH ACTIVA',
    },
    'shop.limited': {
        en: 'LIMITED SUPPLY', pl: 'LIMITOWANA ILOŚĆ', de: 'BEGRENZTE MENGE',
        tr: 'SINIRLI STOK', th: 'จำนวนจำกัด', es: 'STOCK LIMITADO',
    },

    // === GUIDE ===
    'guide.title': {
        en: 'HOW TO PLAY', pl: 'JAK GRAĆ', de: 'SPIELANLEITUNG',
        tr: 'NASIL OYNANIR', th: 'วิธีเล่น', es: 'CÓMO JUGAR',
    },
    'guide.basics_title': {
        en: '⚔️ Basics', pl: '⚔️ Podstawy', de: '⚔️ Grundlagen',
        tr: '⚔️ Temel', th: '⚔️ พื้นฐาน', es: '⚔️ Básico',
    },
    'guide.basics_desc': {
        en: 'Deploy units on the board before each wave. Units auto-attack enemies that come in range. Survive as many waves as possible!',
        pl: 'Rozmieść jednostki na planszy przed każdą falą. Jednostki automatycznie atakują wrogów w zasięgu. Przetrwaj jak najwięcej fal!',
        de: 'Platziere Einheiten auf dem Brett vor jeder Welle. Einheiten greifen Feinde automatisch an. Überlebe so viele Wellen wie möglich!',
        tr: 'Her dalgadan önce birimleri tahtaya yerleştirin. Birimler menzildeki düşmanlara otomatik saldırır. Mümkün olduğunca çok dalga atlatın!',
        th: 'วางยูนิตบนกระดานก่อนแต่ละคลื่น ยูนิตจะโจมตีศัตรูในระยะอัตโนมัติ อยู่รอดให้ได้มากที่สุด!',
        es: '¡Despliega unidades en el tablero antes de cada oleada. Las unidades atacan automáticamente. ¡Sobrevive el mayor número de oleadas!',
    },
    'guide.units_title': {
        en: '🛡️ Units & Traits', pl: '🛡️ Jednostki i Cechy', de: '🛡️ Einheiten & Eigenschaften',
        tr: '🛡️ Birimler & Özellikler', th: '🛡️ ยูนิตและคุณสมบัติ', es: '🛡️ Unidades y Rasgos',
    },
    'guide.units_desc': {
        en: 'Each unit has HP, Damage, and Range stats. Traits like Ironclad (tank), Striker (DPS), Arcane (magic), and Sniper (long range) define their role. Mix traits for the best defense!',
        pl: 'Każda jednostka ma HP, Obrażenia i Zasięg. Cechy jak Ironclad (tank), Striker (DPS), Arcane (magia) i Sniper (daleki zasięg) definiują rolę. Miksuj cechy dla najlepszej obrony!',
        de: 'Jede Einheit hat HP, Schaden und Reichweite. Eigenschaften wie Ironclad (Tank), Striker (DPS), Arcane (Magie) und Sniper (Langstrecke) definieren die Rolle. Mische für die beste Verteidigung!',
        tr: 'Her birimin HP, Hasar & Menzil istatistikleri vardır. Ironclad (tank), Striker (DPS), Arcane (büyü) ve Sniper (uzun menzil) gibi özellikler rollerini belirler. En iyi savunma için karıştırın!',
        th: 'ยูนิตแต่ละตัวมี HP ดาเมจ และระยะ คุณสมบัติเช่น Ironclad (แทงค์), Striker (DPS), Arcane (เวทย์) และ Sniper (ระยะไกล) กำหนดบทบาท ผสมคุณสมบัติเพื่อการป้องกันที่ดีที่สุด!',
        es: 'Cada unidad tiene HP, Daño y Alcance. Rasgos como Ironclad (tanque), Rasgos como Striker (DPS), Arcane (magia) y Sniper (largo alcance) definen su rol. ¡Mezcla para la mejor defensa!',
    },
    'guide.credits_title': {
        en: '💰 Credits & Shop', pl: '💰 Kredyty i Sklep', de: '💰 Credits & Shop',
        tr: '💰 Kredi & Mağaza', th: '💰 เครดิตและร้านค้า', es: '💰 Créditos y Tienda',
    },
    'guide.credits_desc': {
        en: 'Earn credits by killing enemies. Spend them in the Armory to deploy stronger units. Visit the Cyber Armory (WLD shop) for permanent upgrades and power-ups!',
        pl: 'Zdobywaj kredyty zabijając wrogów. Wydawaj je w Zbrojowni na silniejsze jednostki. Odwiedź Cyber Zbrojownię (sklep WLD) po trwałe ulepszenia!',
        de: 'Verdiene Credits durch das Töten von Feinden. Gib sie im Arsenal für stärkere Einheiten aus. Besuche das Cyber Arsenal (WLD-Shop) für permanente Upgrades!',
        tr: 'Düşmanları öldürerek kredi kazanın. Daha güçlü birimler için Cephanelikte harcayın. Kalıcı yükseltmeler için Siber Cephaneliği (WLD mağazası) ziyaret edin!',
        th: 'รับเครดิตจากการฆ่าศัตรู ใช้ในคลังอาวุธเพื่อวางยูนิตที่แข็งแกร่งกว่า เยี่ยมชมคลังอาวุธไซเบอร์ (ร้าน WLD) สำหรับอัพเกrดถาวr!',
        es: '¡Gana créditos matando enemigos. Gástalos en la Armería para desplegar unidades más fuertes. Visita la Armería Cyber (tienda WLD) para mejoras permanentes!',
    },
    'guide.tips_title': {
        en: '💡 Pro Tips', pl: '💡 Porady', de: '💡 Profi-Tipps',
        tr: '💡 İpuçları', th: '💡 เคล็ดลับ', es: '💡 Consejos Pro',
    },
    'guide.tip1': {
        en: 'Place tanky units (Bastion, Titan, Fortress) in front to absorb damage',
        pl: 'Stawiaj tanki (Bastion, Titan, Fortress) z przodu, by absorbowały obrażenia',
        de: 'Platziere Tanks (Bastion, Titan, Fortress) vorne, um Schaden zu absorbieren',
        tr: 'Hasar soğurmak için tankları (Bastion, Titan, Fortress) öne yerleştirin',
        th: 'วางยูนิตแทงค์ (Bastion, Titan, Fortress) ข้างหน้าเพื่อรับดาเมจ',
        es: 'Coloca tanques (Bastion, Titan, Fortress) al frente para absorber daño',
    },
    'guide.tip2': {
        en: 'Snipers and Archmages are best in the back row for maximum range',
        pl: 'Snajperzy i Arcymag najlepsi w tylnym rzędzie — maksymalny zasięg',
        de: 'Sniper und Erzmagier wirken am besten in der hinteren Reihe',
        tr: 'Keskin nişancılar ve Büyücüler maksimum menzil için arka sıraya',
        th: 'สไนเปอร์และอาร์คเมจดีที่สุดในแถวหลังเพื่อระยะสูงสุด',
        es: 'Francotiradores y Archimagos van mejor en la fila trasera',
    },
    'guide.tip3': {
        en: 'Lifebringer heals nearby allies — keep it in the center!',
        pl: 'Lifebringer leczy pobliskie jednostki — trzymaj go w centrum!',
        de: 'Lifebringer heilt Verbündete in der Nähe — halte ihn im Zentrum!',
        tr: 'Lifebringer yakındaki müttefikleri iyileştirir — merkezde tutun!',
        th: 'Lifebringer รักษาพันธมิตรใกล้เคียง — เก็บไว้ตรงกลาง!',
        es: '¡Lifebringer cura aliados cercanos — mantenlo en el centro!',
    },
    'guide.tip4': {
        en: 'Save credits for expensive units — they are much stronger per slot',
        pl: 'Oszczędzaj kredyty na drogie jednostki — są dużo silniejsze',
        de: 'Spare Credits für teure Einheiten — sie sind viel stärker pro Slot',
        tr: 'Pahalı birimler için kredi biriktirin — slot başına çok daha güçlüdürler',
        th: 'เก็บเครดิตสำหรับยูนิตราคาแพง — แข็งแkr่งกว่ามากต่อช่อง',
        es: '¡Ahorra créditos para unidades caras — son mucho más fuertes por espacio!',
    },
}

function detectLanguage(): Language {
    if (typeof window === 'undefined') return 'en'

    const nav = navigator.language || (navigator as any).userLanguage || 'en'
    const code = nav.split('-')[0].toLowerCase()

    const supportedLanguages: Language[] = ['en', 'pl', 'de', 'tr', 'th', 'es']
    if (supportedLanguages.includes(code as Language)) {
        return code as Language
    }
    return 'en'
}

let cachedLang: Language | null = null

export function getLanguage(): Language {
    if (cachedLang) return cachedLang
    cachedLang = detectLanguage()
    return cachedLang
}

export function t(key: string): string {
    const lang = getLanguage()
    const entry = translations[key]
    if (!entry) return key
    return entry[lang] || entry['en'] || key
}

export function useTranslation() {
    const [lang, setLang] = useState<Language>('en')

    useEffect(() => {
        setLang(detectLanguage())
    }, [])

    const translate = useCallback((key: string): string => {
        const entry = translations[key]
        if (!entry) return key
        return entry[lang] || entry['en'] || key
    }, [lang])

    return { t: translate, lang, setLang: (l: Language) => { cachedLang = l; setLang(l) } }
}
