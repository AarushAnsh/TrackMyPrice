import AddProductForm from "@/components/AddProductForm";
import AuthButton from "@/components/AuthButton";
import { createClient } from "@/utils/supabase/server";
import { Rabbit, Shield, Bell, TrendingDown, Sparkles } from "lucide-react";
import { getProducts } from "./actions";
import ProductCard from "@/components/ProductCard";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = user ? await getProducts() : [];

  const FEATURES = [
    {
      icon: Rabbit,
      title: "Lightning Fast",
      description:
        "Extract prices in seconds — handles JavaScript and dynamic content automatically.",
    },
    {
      icon: Shield,
      title: "Always Reliable",
      description:
        "Works across major e-commerce sites with built-in anti-bot protection.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Get email notifications the moment a price drops.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              TrackMyPrice
            </span>
          </div>
          <AuthButton user={user} />
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border/60 bg-linear-to-b from-slate-50/80 to-background">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Smart price tracking for online shoppers
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
                Never Miss a Price Drop
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
                Paste any product URL, track the price automatically, and get
                alerted when it falls — save money without checking every day.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-2xl sm:mt-12">
              <AddProductForm user={user} />
            </div>
          </div>
        </section>

        {products.length === 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {user && products.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-6 flex flex-col gap-1 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Your Tracked Products
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor prices and view history for each product.
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {products.length} {products.length === 1 ? "product" : "products"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {user && products.length === 0 && (
          <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6 sm:pb-20">
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <TrendingDown className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No products yet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Paste a product link above to start tracking its price.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-auto border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} TrackMyPrice. All rights reserved.</p>
          <p>Track smarter. Spend less.</p>
        </div>
      </footer>
    </div>
  );
}
