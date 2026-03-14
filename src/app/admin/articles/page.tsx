'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { AdminGate } from '@/components/admin/AdminGate';
import { useArticles, useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import type { Article } from '@/lib/types';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  published: false,
};

function ArticleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        placeholder="My Skincare Article"
        value={form.title}
        onChange={(e) => {
          set('title', e.target.value);
          if (!initial) set('slug', slugify(e.target.value));
        }}
      />
      <Input
        label="Slug (URL)"
        placeholder="my-skincare-article"
        value={form.slug}
        onChange={(e) => set('slug', slugify(e.target.value))}
      />
      <Textarea
        label="Excerpt"
        placeholder="A short summary shown in the article list..."
        value={form.excerpt}
        onChange={(e) => set('excerpt', e.target.value)}
        rows={2}
      />
      <Textarea
        label="Content"
        placeholder="Write your article here. Each paragraph on a new line."
        value={form.content}
        onChange={(e) => set('content', e.target.value)}
        rows={12}
      />
      <Input
        label="Cover Image URL (optional)"
        placeholder="https://images.unsplash.com/..."
        value={form.coverImage}
        onChange={(e) => set('coverImage', e.target.value)}
      />
      <Input
        label="Tags (comma-separated)"
        placeholder="skincare, retinol, anti-aging"
        value={form.tags}
        onChange={(e) => set('tags', e.target.value)}
      />
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => set('published', e.target.checked)}
          className="w-4 h-4 rounded accent-rose-500"
        />
        <span className="text-sm text-obsidian-700 font-medium">Published (visible to all users)</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.title.trim() || !form.slug.trim()}>
          Save Article
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ArticlesAdmin() {
  const articles = useArticles();
  const { addArticle, updateArticle, deleteArticle } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = (form: typeof EMPTY_FORM) => {
    const now = new Date().toISOString();
    if (editing) {
      updateArticle(editing.id, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        published: form.published,
        publishedAt: form.published && !editing.publishedAt ? now.split('T')[0] : editing.publishedAt,
        updatedAt: now.split('T')[0],
      });
      setEditing(null);
    } else {
      addArticle({
        id: `article-${Date.now()}`,
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        published: form.published,
        publishedAt: form.published ? now.split('T')[0] : undefined,
        updatedAt: now.split('T')[0],
      });
      setShowForm(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Admin</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-obsidian-800">Articles</h1>
        </div>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Article
          </Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="mb-8">
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-obsidian-800 mb-4">
              {editing ? 'Edit Article' : 'New Article'}
            </h2>
            <ArticleForm
              initial={editing ? {
                title: editing.title,
                slug: editing.slug,
                excerpt: editing.excerpt,
                content: editing.content,
                coverImage: editing.coverImage ?? '',
                tags: editing.tags.join(', '),
                published: editing.published,
              } : undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </CardBody>
        </Card>
      )}

      {articles.length === 0 && !showForm ? (
        <div className="text-center py-16 text-obsidian-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No articles yet</p>
          <p className="text-sm mt-1">Click &ldquo;New Article&rdquo; to create your first post.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-obsidian-800 truncate">{article.title}</span>
                      {article.published ? (
                        <Badge variant="default"><Eye className="w-2.5 h-2.5 mr-1" />Published</Badge>
                      ) : (
                        <Badge variant="secondary"><EyeOff className="w-2.5 h-2.5 mr-1" />Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-obsidian-400 truncate mb-1">/articles/{article.slug}</p>
                    <p className="text-sm text-obsidian-500 line-clamp-1">{article.excerpt}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditing(article); setShowForm(false); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-50"
                      onClick={() => setConfirmDelete(article.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Article">
        <p className="text-sm text-obsidian-600 mb-6">Are you sure you want to delete this article? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => { deleteArticle(confirmDelete!); setConfirmDelete(null); }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminArticlesPage() {
  return <AdminGate><ArticlesAdmin /></AdminGate>;
}
