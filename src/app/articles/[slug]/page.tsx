'use client';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { useArticles } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const articles = useArticles();
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

      <div className="prose prose-obsidian max-w-none">
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
    </div>
  );
}
