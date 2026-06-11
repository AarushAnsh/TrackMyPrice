"use client";

import { deleteProduct } from "@/app/actions";
import { useState } from "react";
import PriceChart from "./PriceChart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { normalizeCurrencyCode } from "@/lib/utils";

function formatPrice(currency, price) {
  const currencyCode = normalizeCurrencyCode(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(price));
}

const ProductCard = ({ product }) => {
  const [showChart, setShowChart] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remove this product from tracking?")) return;

    setDeleting(true);
    const result = await deleteProduct(product.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Product removed from tracking.");
    }

    setDeleting(false);
  };

  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex gap-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover bg-muted"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
              No image
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
              {product.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatPrice(product.currency, product.current_price)}
              </span>
              <Badge variant="secondary" className="gap-1 font-normal">
                <TrendingDown className="h-3 w-3" />
                Tracking
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
            className="gap-1.5"
          >
            {showChart ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Chart
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Price History
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View Product
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Remove
          </Button>
        </div>
      </CardContent>

      {showChart && (
        <CardFooter className="border-t border-border/60 bg-muted/30 pt-4">
          <PriceChart productId={product.id} currency={product.currency} />
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;
