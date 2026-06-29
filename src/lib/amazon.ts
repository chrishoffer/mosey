import * as WebBrowser from 'expo-web-browser';
import { env } from './env';

/**
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
