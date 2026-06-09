import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(process.cwd(), ".env");
readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });

const { createClient } = await import("@supabase/supabase-js");
const FirecrawlApp = (await import("firecrawl")).default;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

console.log("\n=== ENV CHECK ===");
console.log({
  FIRECRAWL_API_KEY: !!process.env.FIRECRAWL_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  CRONE_SECRET: !!process.env.CRONE_SECRET,
  RESEND_API_KRY: !!process.env.RESEND_API_KRY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
});

const { data: products, error } = await supabase.from("products").select("*");
if (error) {
  console.error("DB error:", error);
  process.exit(1);
}

console.log(`\n=== PRODUCTS (${products.length}) ===`);

for (const product of products) {
  console.log(`\n--- ${product.name} ---`);
  console.log("DB price:", product.current_price);
  console.log("URL:", product.url);

  try {
    const result = await firecrawl.scrapeUrl(product.url, {
      formats: ["json"],
      onlyMainContent: true,
      waitFor: 3000,
      jsonOptions: {
        schema: {
          type: "object",
          required: ["productName", "currentPrice"],
          properties: {
            productName: { type: "string" },
            currentPrice: { type: "number" },
            currencyCode: { type: "string" },
          },
        },
        prompt: "Extract productName and currentPrice as number from this page.",
      },
    });

    const data = result.json;
    console.log("Scraped:", data);

    if (!data?.currentPrice) {
      console.log("❌ FAILED: no currentPrice");
    } else {
      const oldPrice = parseFloat(product.current_price);
      const newPrice = parseFloat(data.currentPrice);
      console.log(`Price: ${oldPrice} → ${newPrice}`);
      console.log(newPrice < oldPrice ? "✅ DROP detected" : "❌ No drop (need DB price > website price)");
    }
  } catch (err) {
    console.log("❌ SCRAPE ERROR:", err.message);
  }
}
