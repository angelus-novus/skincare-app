'use client';
import Link from 'next/link';
import { FileText, Package, Syringe, LogOut, Shield } from 'lucide-react';
import { AdminGate, useAdminAuth } from '@/components/admin/AdminGate';
import { useArticles, useAppStore } from '@/lib/store';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function AdminDashboard() {
  const { logout } = useAdminAuth();
  const articles = useArticles();
  const products = useAppStore((s) => s.products);
  const procedures = useAppStore((s) => s.procedures);

  const stats = [
    {
      href: '/admin/articles',
      icon: FileText,
      label: 'Articles',
      count: articles.length,
      sub: `${articles.filter((a) => a.published).length} published`,
      color: 'bg-rose-100 text-rose-600',
    },
    {
      href: '/admin/products',
      icon: Package,
      label: 'Products',
      count: products.length,
      sub: 'in database',
      color: 'bg-violet-100 text-violet-600',
    },
    {
      href: '/admin/procedures',
      icon: Syringe,
      label: 'Procedures',
      count: procedures.length,
      sub: 'logged',
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ivory-darker rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-obsidian-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-obsidian-800">Admin</h1>
            <p className="text-sm text-obsidian-400 mt-0.5">Manage your GlowShelf content</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-obsidian-400">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ href, icon: Icon, label, count, sub, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardBody className="p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-obsidian-800 mb-1">{count}</div>
                <div className="text-sm font-semibold text-obsidian-700 group-hover:text-rose-600 transition-colors">{label}</div>
                <div className="text-xs text-obsidian-400 mt-0.5">{sub}</div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
