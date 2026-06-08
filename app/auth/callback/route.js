import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
export async function GET(request) {
    const {searchParams} =new URL(request.url);
    const code =searchParams.get("code");
     console.log("Callback hit");
      console.log("Code:", code);
    if(code){
        const supabase =await createClient();
        await supabase.auth.exchangeCodeForSession(code);

    }

    return NextResponse.redirect(new URL("/",request.url))
     
}