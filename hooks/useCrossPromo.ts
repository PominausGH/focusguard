import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import {
  CrossPromoOffer,
  CrossPromoTrigger,
  getEligibleOffer,
  recordShown,
  recordDismissed,
  recordClicked,
} from '../services/crossPromo';

/**
 * Rolls a cross-promo eligibility check whenever `active` turns true, and
 * exposes handlers to dismiss or open the resulting offer. `active` should
 * reflect a single qualifying occurrence (e.g. "a break is in progress"),
 * not a screen being mounted, so the check runs once per occurrence.
 */
export const useCrossPromo = (trigger: CrossPromoTrigger, active: boolean) => {
  const [offer, setOffer] = useState<CrossPromoOffer | null>(null);

  useEffect(() => {
    if (!active) {
      setOffer(null);
      return;
    }

    let cancelled = false;
    getEligibleOffer(trigger).then((eligible) => {
      if (cancelled || !eligible) return;
      setOffer(eligible);
      recordShown(eligible.id);
      if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('cross_promo_shown', { offerId: eligible.id, trigger });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trigger]);

  const dismiss = useCallback(() => {
    if (!offer) return;
    recordDismissed(offer.id);
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('cross_promo_dismissed', { offerId: offer.id });
    }
    setOffer(null);
  }, [offer]);

  const open = useCallback(() => {
    if (!offer) return;
    recordClicked(offer.id);
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('cross_promo_clicked', { offerId: offer.id });
    }
    Linking.openURL(offer.url).catch((error) => {
      console.error('Error opening cross-promo URL:', error);
    });
    setOffer(null);
  }, [offer]);

  return { offer, dismiss, open };
};
