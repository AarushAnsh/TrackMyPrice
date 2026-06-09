import { scrapeProduct } from "@/lib/firecrawl";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { sendPriceDropAlert } from "@/lib/email";

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
    env: getEnvStatus(),
  });
}

function getEnvStatus() {
  return {
    FIRECRAWL_API_KEY: !!process.env.FIRECRAWL_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRONE_SECRET: !!process.env.CRONE_SECRET,
    RESEND_API_KRY: !!process.env.RESEND_API_KRY,
    RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
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

    const debug = [];

    for (const product of products) {
      const itemDebug = {
        productId: product.id,
        name: product.name,
        url: product.url,
        dbPrice: product.current_price,
        status: "pending",
      };

      try {
        const productData = await scrapeProduct(product.url);
        itemDebug.scraped = {
          productName: productData.productName,
          currentPrice: productData.currentPrice,
          currencyCode: productData.currencyCode,
        };

        if (!productData.currentPrice) {
          itemDebug.status = "failed";
          itemDebug.reason = "Firecrawl returned no currentPrice";
          results.failed++;
          debug.push(itemDebug);
          continue;
        }

        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);
        const currency = productData.currencyCode || product.currency || "INR";

        itemDebug.prices = { oldPrice, newPrice, isDrop: newPrice < oldPrice };

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
          itemDebug.priceHistoryAdded = true;

          if (newPrice < oldPrice) {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            itemDebug.userEmail = user?.email || null;

            if (user?.email) {
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice
              );

              itemDebug.email = emailResult;

              if (emailResult.success) {
                results.alertsSent++;
              }
            } else {
              itemDebug.emailSkipped = "No user email found";
            }
          } else {
            itemDebug.alertSkipped = `Price increased or same drop check failed (${oldPrice} → ${newPrice})`;
          }
        } else {
          itemDebug.note = "No price change";
        }

        results.updated++;
        itemDebug.status = "success";
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        itemDebug.status = "failed";
        itemDebug.reason = error.message;
        results.failed++;
      }

      debug.push(itemDebug);
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      env: getEnvStatus(),
      results,
      debug,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message, env: getEnvStatus() },
      { status: 500 }
    );
  }
}
