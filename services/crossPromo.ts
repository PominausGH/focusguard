/**
 * Cross-promo service for FocusShield.
 *
 * Surfaces occasional, contextually-matched house ads for other Dainty
 * Trading products at natural pause points (break screen, meeting summary).
 * Frequency-capped and self-muting per offer so it never turns into a nag.
 * @module services/crossPromo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type CrossPromoTrigger = 'focus_break' | 'meeting_summary';

export interface CrossPromoOffer {
  id: string;
  trigger: CrossPromoTrigger;
  headline: string;
  body: string;
  ctaLabel: string;
  url: string;
}

// Add more offers here as new free/paid sibling products come online.
// Multiple offers can share a trigger — the first eligible one (by array
// order) is shown, so put the one you most want surfaced first.
export const CROSS_PROMO_OFFERS: CrossPromoOffer[] = [
  {
    id: 'timerforge_focus_break',
    trigger: 'focus_break',
    headline: 'Need timers outside of focus sessions too?',
    body: 'TimerForge is a flexible multi-timer app for cooking, workouts, or anything else that needs a countdown.',
    ctaLabel: 'Check out TimerForge',
    url: 'https://timerforge.app/?utm_source=focusshield&utm_medium=inapp&utm_campaign=crosspromo',
  },
  {
    id: 'subscription_incinerator_meeting_summary',
    trigger: 'meeting_summary',
    headline: "Meetings aren't the only silent cost.",
    body: "Subscription Incinerator finds and kills the recurring subscriptions you forgot you're paying for.",
    ctaLabel: 'Find your wasted subscriptions',
    url: 'https://subscriptionincinerator.app/?utm_source=focusshield&utm_medium=inapp&utm_campaign=crosspromo',
  },
];

const STATE_KEY = '@focusshield_cross_promo_state';

/** Show at most 1 in this many qualifying events, per trigger. */
const SHOW_EVERY_N_TRIGGERS = 5;
/** Minimum gap between any two promo cards shown, regardless of trigger. */
const MIN_HOURS_BETWEEN_ANY_PROMO = 4;
/** Stop showing a specific offer once dismissed this many times. */
const MAX_DISMISSALS_BEFORE_MUTE = 3;

interface OfferState {
  shownCount: number;
  dismissCount: number;
  clicked: boolean;
}

interface CrossPromoState {
  lastShownAt: number | null;
  triggerCounts: Partial<Record<CrossPromoTrigger, number>>;
  offers: Record<string, OfferState>;
}

const DEFAULT_STATE: CrossPromoState = {
  lastShownAt: null,
  triggerCounts: {},
  offers: {},
};

const loadState = async (): Promise<CrossPromoState> => {
  try {
    const stored = await AsyncStorage.getItem(STATE_KEY);
    if (!stored) return { ...DEFAULT_STATE, triggerCounts: {}, offers: {} };
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error loading cross-promo state:', error);
    return { ...DEFAULT_STATE, triggerCounts: {}, offers: {} };
  }
};

const saveState = async (state: CrossPromoState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving cross-promo state:', error);
  }
};

const getOfferState = (state: CrossPromoState, offerId: string): OfferState =>
  state.offers[offerId] || { shownCount: 0, dismissCount: 0, clicked: false };

/**
 * Call on a qualifying app event (e.g. a break starting). Returns the offer
 * to show, or null if none is due yet — handles frequency capping,
 * cross-trigger cooldown, and per-offer muting internally.
 */
export const getEligibleOffer = async (
  trigger: CrossPromoTrigger
): Promise<CrossPromoOffer | null> => {
  const state = await loadState();

  const nextCount = (state.triggerCounts[trigger] || 0) + 1;
  state.triggerCounts[trigger] = nextCount;
  await saveState(state);

  if (nextCount % SHOW_EVERY_N_TRIGGERS !== 0) {
    return null;
  }

  if (state.lastShownAt) {
    const hoursSinceLastShown = (Date.now() - state.lastShownAt) / (1000 * 60 * 60);
    if (hoursSinceLastShown < MIN_HOURS_BETWEEN_ANY_PROMO) {
      return null;
    }
  }

  const candidates = CROSS_PROMO_OFFERS.filter((offer) => offer.trigger === trigger);
  for (const offer of candidates) {
    const offerState = getOfferState(state, offer.id);
    if (offerState.dismissCount >= MAX_DISMISSALS_BEFORE_MUTE) continue;
    return offer;
  }

  return null;
};

export const recordShown = async (offerId: string): Promise<void> => {
  const state = await loadState();
  const offerState = getOfferState(state, offerId);
  state.offers[offerId] = { ...offerState, shownCount: offerState.shownCount + 1 };
  state.lastShownAt = Date.now();
  await saveState(state);
};

export const recordDismissed = async (offerId: string): Promise<void> => {
  const state = await loadState();
  const offerState = getOfferState(state, offerId);
  state.offers[offerId] = { ...offerState, dismissCount: offerState.dismissCount + 1 };
  await saveState(state);
};

export const recordClicked = async (offerId: string): Promise<void> => {
  const state = await loadState();
  const offerState = getOfferState(state, offerId);
  state.offers[offerId] = { ...offerState, clicked: true };
  await saveState(state);
};
