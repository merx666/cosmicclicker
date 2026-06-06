/**
 * Pomocnik do mapowania surowych komunikatów o błędach API i sieciowych
 * na przyjazne i zlokalizowane komunikaty dla użytkowników.
 */
export function mapError(error: any, locale: string = 'en'): string {
    if (!error) return '';
    
    const msg = typeof error === 'string' ? error : (error.message || '');
    const msgLower = msg.toLowerCase();
    const isPl = locale === 'pl';

    // Przeciążenie serwera / High Traffic
    if (
        msgLower.includes('experiencing high traffic') || 
        msgLower.includes('capacity exceeded') || 
        msgLower.includes('too many requests') ||
        msgLower.includes('rate limit') ||
        msgLower.includes('503') ||
        msgLower.includes('429')
    ) {
        return isPl 
            ? 'Nasze serwery są obecnie bardzo obciążone. Spróbuj ponownie za chwilę.' 
            : 'Our servers are experiencing high traffic right now. Please try again in a minute.';
    }

    // Problemy sieciowe / Rozłączenie
    if (
        msgLower.includes('failed to fetch') || 
        msgLower.includes('network') || 
        msgLower.includes('connection timed out') ||
        msgLower.includes('econnrefused')
    ) {
        return isPl
            ? 'Problem z połączeniem sieciowym. Upewnij się, że masz połączenie z internetem i spróbuj ponownie.'
            : 'Network connection issue. Please check your internet connection and try again.';
    }

    // Prace konserwacyjne
    if (
        msgLower.includes('maintenance') || 
        msgLower.includes('season 2 update') ||
        msgLower.includes('update in progress')
    ) {
        return isPl
            ? 'Trwa aktualizacja Sezonu 2. Spróbuj ponownie później.'
            : 'Season 2 update in progress. Please try again later.';
    }

    // Błędy autoryzacji / Nonce
    if (
        msgLower.includes('invalid nonce') || 
        msgLower.includes('nonce mismatch') ||
        msgLower.includes('session expired')
    ) {
        return isPl
            ? 'Sesja wygasła lub podpis jest nieprawidłowy. Odśwież stronę i spróbuj ponownie.'
            : 'Session expired or signature invalid. Please refresh the page and try again.';
    }

    return msg;
}
