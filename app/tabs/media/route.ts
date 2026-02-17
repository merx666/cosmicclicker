import { redirect } from 'next/navigation';

export async function GET(request: Request) {
    // Redirect to the homepage with the media tab active
    // We use 307 Temporary Redirect to preserve the method if needed, but 302/307 is fine.
    // We point to / because middleware should handle the locale.
    redirect('/?tab=media');
}
