import { scrapeProduct } from "@/lib/firecrawl";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { sendPriceDropAlert } from "@/lib/email";

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}

function getBearerToken(authHeader) {
  if (!authHeader) return null;

  const [scheme, ...rest] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;

  const token = rest.join(" ").trim();
  return token || authHeader.replace(/^Bearer\s*/i, "").trim();
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRONE_SECRET;
    const token = getBearerToken(authHeader);

    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*");

    if (productError) throw productError;

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData.currentPrice) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);
        const currency = productData.currencyCode || product.currency || "INR";

        const { error: updateError } = await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency,
            name: productData.productName || product.name,
            image_url: productData.imageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (updateError) throw updateError;

        if (oldPrice !== newPrice) {
          const { error: historyError } = await supabase
            .from("price_history")
            .insert({
              product_id: product.id,
              price: newPrice,
              currency,
            });

          if (historyError) throw historyError;

          results.priceChanges++;

          if (newPrice < oldPrice) {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) {
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice
              );

              if (emailResult.success) {
                results.alertsSent++;
              }
            }
          }
        }

        results.updated++;
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// curl.exe -X POST https://track-my-price-mu.vercel.app/api/crone/check-prices -H "Authorization: Bearer 7eea25d3c15915dcf1a0ca023f41141f057ac2a1194b6acc169a8c2558fd1f80"