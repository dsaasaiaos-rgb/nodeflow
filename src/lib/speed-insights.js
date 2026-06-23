import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Initialize Vercel Speed Insights
 * This should be called once in your app on the client side
 */
export const initSpeedInsights = () => {
  injectSpeedInsights();
};
