import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith('sk_test_placeholder')) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Set it in .env to use Stripe.');
    }
    _stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  }
  return _stripe;
}
