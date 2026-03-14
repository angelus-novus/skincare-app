'use client';
import Link from 'next/link';
import { BookOpen, Tag, Calendar, ArrowRight } from 'lucide-react';
import { useArticles } from '@/lib/store';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ArticlesPage() {
  const articles = useArticles();
  const published = articles.filter((a) => a.published);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-ivory-darker rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-obsidian-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-obsidian-800">Articles</h1>
          <p className="text-sm text-obsidian-400 mt-0.5">Skincare tips, guides & deep dives</p>
        </div>
      </div>

      {published.length === 0 ? (
        <div className="text-center py-24 text-obsidian-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No articles yet</p>
          <p className="text-sm mt-1">Check back soon for skincare tips and guides.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {published.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardBody className="p-6">
                  <div className="flex items-start gap-6">
                    {article.coverImage && (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-xl font-bold text-obsidian-800 group-hover:text-rose-600 transition-colors mb-2 leading-snug">
                        {article.title}
                      </h2>
                      <p className="text-sm text-obsidian-500 leading-relaxed line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        {article.publishedAt && (
                          <span className="text-xs text-obsidian-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        )}
                        <span className="text-xs text-rose-500 flex items-center gap-1 font-medium group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
