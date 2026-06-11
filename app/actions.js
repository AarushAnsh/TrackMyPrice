"use server";

import { scrapeProduct } from "@/lib/firecrawl";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function addProduct(formData) {
  const url = formData.get("url");
  if (!url) {
    return { error: "url is required" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not Authrncicated" };
    }

    const productData = await scrapeProduct(url);
    if (!productData.productName || !productData.currentPrice) {
      return { error: "could not extract product information from this url" };
    }

    const newPrice = parseFloat(productData.currentPrice);
    const currency = productData.currencyCode || "INR";

    const { data: existingProduct } = await supabase
      .from("products")
      .select("id,current_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    const isUpdate = !!existingProduct;

    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url,
          name: productData.productName,
          current_price: newPrice,
          currency: currency,
          image_url: productData.imageUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,url",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) throw error;

    const shouldAddHistory =
      !isUpdate || existingProduct.current_price !== newPrice;

    if (shouldAddHistory) {
      const admin = createAdminClient();
      const { error: historyError } = await admin
        .from("price_history")
        .insert({
          product_id: product.id,
          price: newPrice,
          currency: currency,
        });

      if (historyError) {
        return { error: `Price history save failed: ${historyError.message}` };
      }
    }

    revalidatePath("/");
    return {
      succes: true,
      product,
      message: isUpdate
        ? "product updated wit latest price"
        : "product added successfully!",
    };
  } catch (error) {
    return { error: error.message || "failed to add product" };
  }
}

export async function deleteProduct(producID) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", producID);

    if (error) throw error;
    revalidatePath("/");
    return { succes: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getProducts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single();

    if (productError || !product) return [];

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}
