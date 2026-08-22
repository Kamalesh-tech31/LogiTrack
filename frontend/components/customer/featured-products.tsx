"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/api";
import Link from "next/link";

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState(
    products.slice(0, 4),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const productsData = await fetchProducts();
        if (Array.isArray(productsData)) {
          // normalize product id fallback to _id when necessary
          const normalized = productsData.map((p: any, i: number) => ({
            id: p.id || p._id || `product-${i}`,
            name: p.name,
            price: p.price,
            image:
              p.image ||
              (Array.isArray(p.images) && p.images[0]) ||
              "/placeholder.png",
            category: p.category || "General",
            featured: p.featured,
          }));

          const featured = normalized
            .filter((p: any) => p.featured)
            .slice(0, 4);
          setFeaturedProducts(
            featured.length > 0 ? featured : normalized.slice(0, 4),
          );
        }
      } catch (error) {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F4F4F5]">
          Featured Products
        </h2>
        <Link
          href="/customer/products"
          className="text-sm font-medium text-[#F97316] hover:text-[#EA580C] transition"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {featuredProducts.map((product) => (
          <Card
            key={product.id}
            className="group overflow-hidden border border-[#2A2B30] bg-[#1A1B1E] shadow-sm hover:border-[#F97316] transition-all"
          >
            <CardContent className="p-0 rounded-3xl">
              <div className="relative aspect-square overflow-hidden bg-[#111214]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-[#A1A1AA]">{product.category}</p>
                <h3 className="mt-1 font-semibold text-white">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-white">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <Button size="sm" className="h-8 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white cursor-pointer">
                    Add To Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
