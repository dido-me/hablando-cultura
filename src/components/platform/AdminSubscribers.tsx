// Panel de suscriptores del newsletter y del e-book: buscar, filtrar, exportar a Excel,
// dar de baja y eliminar.

import { useEffect, useState, type FormEvent } from 'react';
import { api, API_URL, ApiError, getToken } from '../../lib/platform/api';
import { date } from '../../lib/platform/format';
import type { Metadata, Subscriber, SubscriberStats } from '../../lib/platform/types';
import AdminGate from './AdminGate';
import { Alert, Badge, Button, Card, Loading } from './ui';

const sourceLabels: Record<string, string> = {
  'newsletter-blog': 'Newsletter',
  'ebook-landing': 'E-book',
};

export default function AdminSubscribers() {
  return (
    <AdminGate>
      <Subscribers />
    </AdminGate>
  );
}

function Subscribers() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({});
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const filters = () => new URLSearchParams({ search: query, source, status }).toString();

  const load = () => {
    setError('');
    api<{ stats: SubscriberStats }>('/v1/admin/subscribers/stats').then((data) => setStats(data.stats)).catch(() => {});
    api<{ subscribers: Subscriber[]; metadata: Metadata }>(`/v1/admin/subscribers?${filters()}&page=${page}&page_size=25&sort=-created_at`)
      .then((data) => {
        setSubscribers(data.subscribers);
        setMetadata(data.metadata);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los suscriptores.'));
  };

  useEffect(load, [query, source, status, page]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  // El CSV necesita el token, así que se descarga con fetch y no con un enlace directo.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/subscribers/export?${filters()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      const name = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'suscriptores.csv';
      const url = URL.createObjectURL(await res.blob());
      const link = Object.assign(document.createElement('a'), { href: url, download: name });
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const act = async (subscriber: Subscriber, action: 'unsubscribe' | 'delete') => {
    const question =
      action === 'delete' ? `¿Eliminar a ${subscriber.email} para siempre? No se puede deshacer.` : `¿Dar de baja a ${subscriber.email}? Dejará de recibir correos.`;
    if (!window.confirm(question)) return;
    try {
      await api(action === 'delete' ? `/v1/admin/subscribers/${subscriber.id}` : `/v1/admin/subscribers/${subscriber.id}/unsubscribe`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-4xl font-bold text-slate-900">Suscriptores</h1>
        <Button variant="secondary" loading={exporting} onClick={exportCsv}>
          <span className="material-symbols-outlined text-lg">download</span> Exportar a Excel
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Activos" value={stats.active} />
          <Stat label="Nuevos este mes" value={stats.new_this_month} />
          {Object.entries(sourceLabels).map(([key, label]) => (
            <Stat key={key} label={label} value={stats.by_source[key] ?? 0} />
          ))}
        </div>
      )}

      <Card className="space-y-4">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100"
          />
          <Select label="Fuente" value={source} onChange={(v) => (setSource(v), setPage(1))} options={[['', 'Todas las fuentes'], ...Object.entries(sourceLabels)]} />
          <Select label="Estado" value={status} onChange={(v) => (setStatus(v), setPage(1))} options={[['active', 'Activos'], ['unsubscribed', 'De baja'], ['', 'Todos']]} />
          <Button type="submit">Buscar</Button>
        </form>

        {error && <Alert tone="error">{error}</Alert>}

        {!subscribers ? (
          <Loading />
        ) : subscribers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay suscriptores con estos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-3 pr-4 font-semibold">Fecha</th>
                  <th className="py-3 pr-4 font-semibold">Correo</th>
                  <th className="py-3 pr-4 font-semibold">Nombre</th>
                  <th className="py-3 pr-4 font-semibold">WhatsApp</th>
                  <th className="py-3 pr-4 font-semibold">Fuente</th>
                  <th className="py-3 pr-4 font-semibold">Estado</th>
                  <th className="py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="py-3 pr-4 text-slate-500">{date(subscriber.created_at)}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{subscriber.email}</td>
                    <td className="py-3 pr-4 text-slate-600">{subscriber.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{subscriber.wants_whatsapp ? 'Sí' : 'No'}</td>
                    <td className="py-3 pr-4 text-slate-600">{subscriber.sources.map((s) => sourceLabels[s] ?? s).join(', ')}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={subscriber.status === 'active' ? 'success' : 'neutral'}>{subscriber.status === 'active' ? 'Activo' : 'De baja'}</Badge>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {subscriber.status === 'active' && (
                        <button className="mr-3 text-xs font-semibold text-slate-500 hover:text-[var(--primary)]" onClick={() => act(subscriber, 'unsubscribe')}>
                          Dar de baja
                        </button>
                      )}
                      <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => act(subscriber, 'delete')}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(metadata.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-slate-500">
              Página {page} de {metadata.last_page} · {metadata.total_records} en total
            </span>
            <Button variant="secondary" disabled={page >= (metadata.last_page ?? 1)} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-slate-900">{value.toLocaleString('es-PE')}</p>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
    >
      {options.map(([v, text]) => (
        <option key={v} value={v}>
          {text}
        </option>
      ))}
    </select>
  );
}
