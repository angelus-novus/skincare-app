'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Heart, Package, Syringe, Check } from 'lucide-react';
import { useArticles, useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import type { Product, Procedure } from '@/lib/types';

function LinkedProductCard({ product }: { product: Product }) {
  const { addWishlistItem, wishlist } = useAppStore();
  const alreadyWishlisted = wishlist.some((w) => w.id === product.id) || product.isWishlisted;
  const [added, setAdded] = useState(alreadyWishlisted);

  const handleWishlist = () => {
    if (added) return;
    addWishlistItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      imageUrl: product.imageUrl,
      price: product.price,
      purchaseUrl: product.purchaseUrl,
      addedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
    });
    setAdded(true);
  };

  return (
    <Card>
      <CardBody className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: product.imageColor }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Package className="w-5 h-5 text-white/70" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-obsidian-800 truncate">{product.name}</p>
          <p className="text-xs text-obsidian-400">{product.brand}{product.price ? ` · $${product.price}` : ''}</p>
        </div>
        <Button
          size="sm"
          variant={added ? 'secondary' : 'outline'}
          onClick={handleWishlist}
          disabled={added}
        >
          {added ? (
            <><Check className="w-3.5 h-3.5" /> Wishlisted</>
          ) : (
            <><Heart className="w-3.5 h-3.5" /> Wishlist</>
          )}
        </Button>
      </CardBody>
    </Card>
  );
}

function LinkedProcedureCard({ procedure }: { procedure: Procedure }) {
  const { addProcedureWishlistItem, procedureWishlist } = useAppStore();
  const alreadyWishlisted = procedureWishlist.some((w) => w.id === procedure.id);
  const [added, setAdded] = useState(alreadyWishlisted);

  const handleWishlist = () => {
    if (added) return;
    addProcedureWishlistItem({
      id: procedure.id,
      name: procedure.name,
      category: procedure.category,
      addedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      concerns: procedure.concerns,
      description: procedure.notes,
      downtime: procedure.downtime,
    });
    setAdded(true);
  };

  return (
    <Card>
      <CardBody className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-blue-100">
          <Syringe className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-obsidian-800 truncate">{procedure.name}</p>
          <p className="text-xs text-obsidian-400 capitalize">{procedure.category}{procedure.cost ? ` · $${procedure.cost}` : ''}</p>
        </div>
        <Button
          size="sm"
          variant={added ? 'secondary' : 'outline'}
          onClick={handleWishlist}
          disabled={added}
        >
          {added ? (
            <><Check className="w-3.5 h-3.5" /> Wishlisted</>
          ) : (
            <><Heart className="w-3.5 h-3.5" /> Wishlist</>
          )}
        </Button>
      </CardBody>
    </Card>
  );
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const articles = useArticles();
  const { products, procedures } = useAppStore();
  const article = articles.find((a) => a.slug === slug && a.published);

  if (!article) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/articles">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </Button>
        </Link>
        <div className="text-center py-24 text-obsidian-400">
          <p className="text-lg font-medium">Article not found</p>
        </div>
      </div>
    );
  }

  const linkedProducts = (article.linkedProductIds ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const linkedProcedures = (article.linkedProcedureIds ?? [])
    .map((id) => procedures.find((p) => p.id === id))
    .filter(Boolean) as Procedure[];

  const hasLinked = linkedProducts.length > 0 || linkedProcedures.length > 0;

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/articles">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </Button>
      </Link>

      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-64 object-cover rounded-2xl mb-8"
        />
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {article.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            <Tag className="w-2.5 h-2.5 mr-1" />{tag}
          </Badge>
        ))}
      </div>

      <h1 className="text-4xl font-bold text-obsidian-800 leading-tight mb-4">{article.title}</h1>

      {article.publishedAt && (
        <p className="text-sm text-obsidian-400 flex items-center gap-1.5 mb-8 pb-8 border-b border-ivory-darker">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      <div className="mb-10">
        {article.content.split('\n').map((para, i) =>
          para.trim() ? (
            <p key={i} className="text-obsidian-700 leading-relaxed mb-4 text-base">
              {para}
            </p>
          ) : (
            <br key={i} />
          )
        )}
      </div>

      {hasLinked && (
        <div className="border-t border-ivory-darker pt-8 space-y-6">
          <h2 className="text-lg font-bold text-obsidian-800">Featured in this article</h2>

          {linkedProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-obsidian-500 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" /> Products
              </h3>
              {linkedProducts.map((p) => <LinkedProductCard key={p.id} product={p} />)}
            </div>
          )}

          {linkedProcedures.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-obsidian-500 uppercase tracking-wider flex items-center gap-2">
                <Syringe className="w-4 h-4" /> Procedures
              </h3>
              {linkedProcedures.map((p) => <LinkedProcedureCard key={p.id} procedure={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
