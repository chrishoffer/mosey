import * as WebBrowser from 'expo-web-browser';
import { env } from './env';

/**
 * DORMANT in v1 — Amazon Associates is deferred (see FUTURE.md). This module is
 * kept (and tested) so re-enabling is a one-line change in PackingPanel: import
 * `openAmazon` and render a "Buy on Amazon" button when `item.amazon_query` is set.
 * Nothing in the shipped UI imports it today.
 *
 * Builds an Amazon search URL for a physical-goods query, tagged with our
 * Associates id. We deliberately link to a *search* (not a single product) so we
 * never imply a specific endorsed SKU or "added to cart" — just "here's where to
 * buy this kind of thing". Physical goods only.
 */
export function buildAmazonUrl(query: string): string {
  const k = encodeURIComponent(query.trim());
  const tag = env.amazonTag ? `&tag=${encodeURIComponent(env.amazonTag)}` : '';
  return `https://www.amazon.com/s?k=${k}${tag}`;
}

/** Opens the Amazon listing in the system browser. */
export async function openAmazon(query: string): Promise<void> {
  await WebBrowser.openBrowserAsync(buildAmazonUrl(query), {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
