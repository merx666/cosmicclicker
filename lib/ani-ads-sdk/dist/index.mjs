// src/index.tsx
import { useEffect, useState, useCallback } from "react";

// src/fetch-retry.ts
var DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1e3,
  // 1 second
  maxDelay: 1e4,
  // 10 seconds
  timeout: 3e4,
  // 30 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    "ERR_CONNECTION_RESET",
    "ERR_CONNECTION_REFUSED",
    "ERR_CONNECTION_CLOSED",
    "ERR_NETWORK_CHANGED",
    "ERR_INTERNET_DISCONNECTED",
    "Failed to fetch",
    "NetworkError",
    "Network request failed"
  ]
};
function isRetryableError(error, status, retryableStatuses, retryableErrors) {
  if (status && retryableStatuses.includes(status)) {
    return true;
  }
  const errorMessage = error?.message || error?.toString() || "";
  const errorName = error?.name || "";
  const allErrorStrings = [errorMessage, errorName].join(" ").toLowerCase();
  return retryableErrors.some(
    (retryableError) => allErrorStrings.includes(retryableError.toLowerCase())
  );
}
function createTimeoutPromise(timeout) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function calculateDelay(attempt, initialDelay, maxDelay) {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}
async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  const { maxRetries, initialDelay, maxDelay, timeout, retryableStatuses, retryableErrors } = opts;
  let lastError;
  let lastResponse;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const signal = options.signal ? (() => {
        const combinedController = new AbortController();
        const existingSignal = options.signal;
        existingSignal.addEventListener("abort", () => combinedController.abort());
        controller.signal.addEventListener("abort", () => combinedController.abort());
        return combinedController.signal;
      })() : controller.signal;
      try {
        const response = await Promise.race([
          fetch(url, {
            ...options,
            signal,
            // Add keep-alive header to maintain connections
            headers: {
              ...options.headers,
              "Connection": "keep-alive"
            }
          }),
          createTimeoutPromise(timeout)
        ]);
        clearTimeout(timeoutId);
        if (!response.ok && isRetryableError(null, response.status, retryableStatuses, retryableErrors)) {
          lastResponse = response;
          if (attempt < maxRetries) {
            const delay = calculateDelay(attempt, initialDelay, maxDelay);
            console.warn(`[fetchWithRetry] Request failed with status ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, {
              url,
              status: response.status,
              attempt: attempt + 1,
              maxRetries
            });
            await sleep(delay);
            continue;
          }
        }
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (isRetryableError(fetchError, void 0, retryableStatuses, retryableErrors)) {
          lastError = fetchError;
          if (attempt < maxRetries) {
            const delay = calculateDelay(attempt, initialDelay, maxDelay);
            console.warn(`[fetchWithRetry] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, {
              url,
              error: fetchError?.message || fetchError,
              attempt: attempt + 1,
              maxRetries
            });
            await sleep(delay);
            continue;
          }
        }
        throw fetchError;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        console.error(`[fetchWithRetry] Max retries (${maxRetries}) reached, giving up:`, {
          url,
          error: error?.message || error
        });
        throw error;
      }
    }
  }
  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error("Unknown error in fetchWithRetry");
}

// src/index.tsx
import { jsx } from "react/jsx-runtime";
var AniAds = ({
  creator_wallet,
  app_name,
  user_wallet_address,
  api_url = "https://ani-ads.pages.dev/",
  // Default API URL
  onAdClick
}) => {
  const normalizedApiUrl = api_url.replace(/\/+$/, "");
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const getImageUrl = (ad2) => {
    return ad2.image_square || null;
  };
  const trackClick = useCallback(async () => {
    console.log("[AniAds SDK] Click detected", {
      hasAd: !!ad,
      hasWalletAddress: !!user_wallet_address,
      destinationUrl: ad?.destination_url,
      adId: ad?.id
    });
    if (!ad || !user_wallet_address) {
      console.warn("[AniAds SDK] Click tracking skipped - missing ad or wallet address");
      return;
    }
    try {
      console.log("[AniAds SDK] Sending click tracking request", {
        ad_id: ad.id,
        creator_wallet: creator_wallet.toLowerCase(),
        app_name,
        user_wallet_address: user_wallet_address.toLowerCase(),
        api_url: `${normalizedApiUrl}/api/ads/click`
      });
      fetchWithRetry(`${normalizedApiUrl}/api/ads/click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ad_id: ad.id,
          creator_wallet: creator_wallet.toLowerCase(),
          app_name,
          user_wallet_address: user_wallet_address.toLowerCase()
        })
      }, {
        maxRetries: 2,
        // Fewer retries for click tracking (not critical)
        timeout: 1e4
        // 10 second timeout for click tracking
      }).then((response) => {
        console.log("[AniAds SDK] Click tracking response", {
          status: response.status,
          ok: response.ok
        });
        if (response.ok && onAdClick) {
          console.log("[AniAds SDK] Calling onAdClick callback");
          onAdClick(ad.id, ad.destination_url);
        }
      }).catch((err) => {
        console.error("[AniAds SDK] Error tracking click:", err);
      });
    } catch (err) {
      console.error("[AniAds SDK] Error in trackClick:", err);
    }
  }, [ad, creator_wallet, app_name, user_wallet_address, normalizedApiUrl, onAdClick]);
  const getBestImage = (ad2) => {
    return getImageUrl(ad2);
  };
  const trackImpression = useCallback(async (adId) => {
    if (!adId || !creator_wallet || !app_name || !user_wallet_address) return;
    try {
      await fetchWithRetry(`${normalizedApiUrl}/api/ads/impression`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ad_id: adId,
          creator_wallet: creator_wallet.toLowerCase(),
          app_name,
          user_wallet_address: user_wallet_address.toLowerCase()
        })
      }, {
        maxRetries: 2,
        // Fewer retries for impression tracking (not critical)
        timeout: 1e4
        // 10 second timeout for impression tracking
      });
    } catch (err) {
      console.error("Error tracking impression:", err);
    }
  }, [creator_wallet, app_name, user_wallet_address, normalizedApiUrl]);
  useEffect(() => {
    let cancelled = false;
    const loadAd = async () => {
      if (!creator_wallet || !app_name) {
        setLoading(false);
        return;
      }
      if (!user_wallet_address) {
        console.warn("[AniAds SDK] No user_wallet_address provided - ads will not be shown");
        setLoading(false);
        setAd(null);
        setError("user_wallet_address is required");
        return;
      }
      try {
        const { getIsUserVerified } = await import("@worldcoin/minikit-js");
        console.log("[AniAds SDK] Checking Address Book verification for user:", user_wallet_address.toLowerCase());
        const isUserVerified = await getIsUserVerified(user_wallet_address);
        console.log("[AniAds SDK] Address Book verification result:", {
          user_wallet_address: user_wallet_address.toLowerCase(),
          isVerified: isUserVerified,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (!isUserVerified) {
          console.log("[AniAds SDK] User is NOT verified in Address Book - ads will still be shown but with lower earnings (2% instead of 5%)");
        } else {
          console.log("[AniAds SDK] User is verified in Address Book - proceeding to load ads with full earnings (5%)");
        }
      } catch (verificationError) {
        console.warn("[AniAds SDK] Error checking Address Book verification - continuing anyway:", {
          user_wallet_address: user_wallet_address.toLowerCase(),
          error: verificationError?.message || verificationError,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      try {
        setLoading(true);
        setError(null);
        const response = await fetchWithRetry(`${normalizedApiUrl}/api/ads/sdk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            creator_wallet: creator_wallet.toLowerCase(),
            app_name,
            user_wallet_address: user_wallet_address.toLowerCase()
          })
        }, {
          maxRetries: 3,
          // Retry up to 3 times for ad loading (critical)
          timeout: 2e4
          // 20 second timeout for ad loading
        });
        if (cancelled) return;
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch ads`);
        }
        const data = await response.json();
        if (cancelled) return;
        if (data.ad) {
          setAd(data.ad);
          setError(null);
          trackImpression(data.ad.id);
        } else {
          setAd(null);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching ad:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load ad";
        if (errorMessage.includes("timeout") || errorMessage.includes("ERR_CONNECTION")) {
          setError("Network connection issue. Please check your internet connection and try again.");
        } else {
          setError(errorMessage);
        }
        setAd(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadAd();
    return () => {
      cancelled = true;
    };
  }, [creator_wallet, app_name, user_wallet_address, normalizedApiUrl]);
  if (loading || error || !ad) {
    return null;
  }
  const imageUrl = getBestImage(ad);
  if (!imageUrl) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "a",
    {
      href: ad.destination_url,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: (e) => {
        console.log("[AniAds SDK] Anchor tag onClick fired", {
          destinationUrl: ad.destination_url,
          href: e.currentTarget.href
        });
        trackClick();
      },
      style: {
        display: "inline-block",
        width: "100%",
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        textDecoration: "none"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      },
      children: /* @__PURE__ */ jsx(
        "img",
        {
          src: imageUrl,
          alt: ad.title,
          style: {
            width: "100%",
            height: "auto",
            display: "block"
          },
          loading: "lazy"
        }
      )
    }
  );
};
var index_default = AniAds;
export {
  AniAds,
  index_default as default
};
//# sourceMappingURL=index.mjs.map