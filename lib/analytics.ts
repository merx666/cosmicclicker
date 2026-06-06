export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        try {
            (window as any).gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        } catch (e) {
            console.error('[GA4 Error]:', e);
        }
    }
};
