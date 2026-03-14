'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Syringe } from 'lucide-react';
import { AdminGate } from '@/components/admin/AdminGate';
import { useAppStore, useProcedures } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import type { Procedure, ProcedureCategory } from '@/lib/types';

const CATEGORIES: ProcedureCategory[] = [
  'laser','injectables','facials','peels','microneedling','light-therapy','body','other',
];

const EMPTY_FORM = {
  name: '',
  category: 'facials' as ProcedureCategory,
  date: '',
  provider: '',
  clinic: '',
  cost: '',
  notes: '',
  results: '',
  downtime: '',
};

function ProcedureForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Procedure Name" placeholder="e.g. HydraFacial" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className="space-y-1.5">
          <label className="text-xs font-medium tracking-wider uppercase text-obsidian-500">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-obsidian-800 bg-white border border-ivory-darker focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        <Input label="Cost (optional)" placeholder="e.g. 250" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Provider (optional)" placeholder="e.g. Dr. Smith" value={form.provider} onChange={(e) => set('provider', e.target.value)} />
        <Input label="Clinic (optional)" placeholder="e.g. Glow Clinic" value={form.clinic} onChange={(e) => set('clinic', e.target.value)} />
      </div>
      <Input label="Downtime (optional)" placeholder="e.g. 2–3 days redness" value={form.downtime} onChange={(e) => set('downtime', e.target.value)} />
      <Textarea label="Notes (optional)" placeholder="Any notes about the procedure..." value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
      <Textarea label="Results (optional)" placeholder="How did your skin respond?" value={form.results} onChange={(e) => set('results', e.target.value)} rows={3} />
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.date}>Save Procedure</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ProceduresAdmin() {
  const procedures = useProcedures();
  const { addProcedure, updateProcedure, deleteProcedure } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = (form: typeof EMPTY_FORM) => {
    if (editing) {
      updateProcedure(editing.id, {
        name: form.name,
        category: form.category,
        date: form.date,
        provider: form.provider || undefined,
        clinic: form.clinic || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes || undefined,
        results: form.results || undefined,
        downtime: form.downtime || undefined,
      });
      setEditing(null);
    } else {
      addProcedure({
        id: `procedure-${Date.now()}`,
        name: form.name,
        category: form.category,
        date: form.date,
        provider: form.provider || undefined,
        clinic: form.clinic || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes || undefined,
        results: form.results || undefined,
        downtime: form.downtime || undefined,
        concerns: [],
        sideEffects: [],
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
        <h1 className="text-2xl font-bold text-obsidian-800 flex-1">Procedures</h1>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Procedure</Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="mb-8">
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-obsidian-800 mb-4">{editing ? 'Edit Procedure' : 'Add Procedure'}</h2>
            <ProcedureForm
              initial={editing ? {
                name: editing.name,
                category: editing.category,
                date: editing.date,
                provider: editing.provider ?? '',
                clinic: editing.clinic ?? '',
                cost: editing.cost?.toString() ?? '',
                notes: editing.notes ?? '',
                results: editing.results ?? '',
                downtime: editing.downtime ?? '',
              } : undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </CardBody>
        </Card>
      )}

      {procedures.length === 0 && !showForm ? (
        <div className="text-center py-16 text-obsidian-400">
          <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No procedures yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {procedures.map((procedure) => (
            <Card key={procedure.id}>
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-obsidian-800">{procedure.name}</span>
                      <Badge variant="secondary">{procedure.category}</Badge>
                    </div>
                    <p className="text-xs text-obsidian-400">
                      {procedure.date}{procedure.clinic ? ` · ${procedure.clinic}` : ''}{procedure.cost ? ` · $${procedure.cost}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(procedure); setShowForm(false); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50" onClick={() => setConfirmDelete(procedure.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Procedure">
        <p className="text-sm text-obsidian-600 mb-6">Are you sure you want to delete this procedure? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { deleteProcedure(confirmDelete!); setConfirmDelete(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminProceduresPage() {
  return <AdminGate><ProceduresAdmin /></AdminGate>;
}
