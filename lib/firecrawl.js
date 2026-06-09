import FirecrawlApp from 'firecrawl';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const BAD_IMAGE_PATTERNS = [
  'transparent',
  'placeholder',
  'loading',
  'spinner',
  'blank',
  'no-image',
  'default-image',
  '1x1',
  'pixel.gif',
];

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http')) return false;
  const lower = url.toLowerCase();
  return !BAD_IMAGE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function pickBestImageUrl(extractedData, result) {
  const candidates = [
    extractedData?.imageUrl,
    result?.metadata?.ogImage,
    result?.metadata?.og_image,
  ].filter(Boolean);

  return candidates.find(isValidImageUrl) || null;
}

export async function scrapeProduct(url) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['json'],
      onlyMainContent: true,
      waitFor: 3000,
      jsonOptions: {
        schema: {
          type: 'object',
          required: ['productName', 'currentPrice'],
          properties: {
            productName: { type: 'string' },
            currentPrice: { type: 'number' },
            originalPrice: { type: 'number' },
            currencyCode: { type: 'string' },
            imageUrl: { type: 'string' },
            inStock: { type: 'boolean' },
          },
        },
        prompt: `
Extract the product details from this e-commerce page.

Return:
- productName: the full product name/title
- currentPrice: the current selling price as a number only (without currency symbols)
- originalPrice: the original price before discount, if available
- currencyCode: the currency code (USD, EUR, INR, GBP, etc.)
- imageUrl: the MAIN product photo URL — must be a full https:// URL of the actual product image
- inStock: true if the product is available to purchase, otherwise false

For imageUrl:
- Use the large hero/gallery product image only
- Must be a complete absolute URL starting with https://
- Do NOT use placeholder, transparent, loading, spinner, logo, or icon images
- Do NOT use URLs containing: transparent, placeholder, loading, blank, default
- Prefer og:image or the primary product gallery image

Only extract values that are clearly visible on the page.
`,
      },
    });

    const extractedData = result.json;

    if (!extractedData || !extractedData.productName) {
      throw new Error('No data is extracted url');
    }

    extractedData.imageUrl = pickBestImageUrl(extractedData, result);

    return extractedData;
  } catch (error) {
    throw new Error(`Failed to scrap product:${error.message}`);
  }
}

