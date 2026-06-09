import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";
import { Currency } from "lucide-react";
import { NextRequest, NextResponse } from "next/server";
import {sendPriceDropAlert} from "@/lib/emali";

export async function GET() {

    return NextResponse.json({
        message:"price check endpoint is working use POST to trigger"
    })
    
}

export async function POST(request) {
    try{
  const authHeader = request.headers.get("authorization");
  const croneSecret = process.env.CRONE_SECRET;

   if(!croneSecret || authHeader !==`Bearer${croneSecret}`){
    return NextResponse.json({eror:"Unauthorized"},{status:401})
   }
//    use service role to bypass RLS
  const supasbase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const {data:products,error:productError}=await supasbase.from("products")
  .select("*");

if(productError) throw productError;
console.log(`fond ${products.length} products to check`)

const results ={
    total : products.length,
    updated:0,
    failed:0,
    priceChanges:0,
    alertSent:0,
};
for(const product of products){
    try{
        const productData = await scrapeProduct(product.url);
        if(!productData.currentPrice){
            results.failed++;
            continue;

        }
        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);

        (await supasbase).from("products").update({
            current_price:newPrice,
            Currency:productData.currencyCode || product.Currency,
            name:productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
        })
        .eq("id",product.id);

        if(oldPrice!== newPrice){
            (await supasbase).from("price_history").insert({
                product_id:product.id,
                price:newPrice,
                Currency: product.currencyCode || product.Currency,
            })
            results.priceChanges++;
            if(newPrice < oldPrice){
                // alert
                const {
                    data :{user},
                }=await supasbase.auth.admin.getUserById(product.user_id);

                if(user?.email){
                    //  send Email
                   const emailResults =await sendPriceDropAlert(
                    user.email,
                    product,
                    oldPrice,
                    newPrice
                   ); 
                   if(emailResults.success){
                    results.alertSent++;
                   }
                }
            }
        }
        results.updated++;
    }
    catch(error){
  console.error(`error processing product ${product.id}:,error`);
  results.failed++;
    }
}

return NextResponse.json({
    success:true,
    message:"Price check completed",
    results,
});


    } catch(error){
    console.error("Crone job error:",error);
    return NextResponse.json({error:error.message},{status:500});
    }
}