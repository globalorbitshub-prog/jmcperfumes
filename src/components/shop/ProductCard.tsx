import Link from "next/link";
import { formatEUR } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_urls: string[] | null;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  fromPrice?: boolean;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.image_urls?.[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded border border-border overflow-hidden hover:shadow-lg transition"
    >
      <div className="relative aspect-square overflow-hidden bg-border/30">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/30 text-sm">
            Sin imagen
          </div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded">NUEVO</span>
        )}
        {product.stock > 0 && product.stock < 5 && (
          <span className="absolute top-2 right-2 bg-warning text-white text-xs px-2 py-1 rounded">
            Quedan {product.stock}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-primary/70 text-white text-xs px-2 py-1 rounded">Agotado</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-primary text-sm truncate">{product.name}</h3>
        {product.rating != null && (
          <div className="text-xs text-accent">
            {"★".repeat(Math.round(product.rating))}
            {"☆".repeat(5 - Math.round(product.rating))}{" "}
            <span className="text-primary/50">({product.reviewCount || 0})</span>
          </div>
        )}
        <div className="font-heading text-lg text-accent mt-1">
          {product.fromPrice ? `Desde ${formatEUR(product.price)}` : formatEUR(product.price)}
        </div>
      </div>
    </Link>
  );
}
