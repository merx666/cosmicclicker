import React from 'react';

interface AniAdsProps {
    creator_wallet: string;
    app_name: string;
    user_wallet_address: string;
    api_url?: string;
    onAdClick?: (adId: string, destinationUrl: string) => void;
}
declare const AniAds: React.FC<AniAdsProps>;

export { AniAds, type AniAdsProps, AniAds as default };
