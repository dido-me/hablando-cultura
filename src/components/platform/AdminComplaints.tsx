// Panel del Libro de Reclamaciones: Karolay ve cada hoja y la responde. La respuesta le
// llega al consumidor por correo; por ley hay 15 días hábiles para darla.

import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { dateTime, soles } from '../../lib/platform/format';
import type { Complaint, Metadata } from '../../lib/platform/types';
import AdminGate from './AdminGate';
import { Alert, Badge, Button, Card, Loading } from './ui';

const tabs = [
  { status: 'pending', label: 'Por responder' },
  { status: 'answered', label: 'Respondidas' },
  { status: '', label: 'Todas' },
] as const;

export default function AdminComplaints() {
  return (
    <AdminGate>
      <Complaints />
    </AdminGate>
  );
}

function Complaints() {
  const [status, setStatus] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({});
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api<{ complaints: Complaint[]; metadata: Metadata }>(`/v1/admin/complaints?status=${status}&page=${page}&page_size=20&sort=-created_at`)
      .then((data) => {
        setComplaints(data.complaints);
        setMetadata(data.metadata);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las hojas.'));
  };

  useEffect(load, [status, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold text-slate-900">Libro de Reclamaciones</h1>
        <p className="mt-2 text-sm text-slate-500">Responde cada hoja en un plazo máximo de 15 días hábiles. La respuesta se envía al correo del consumidor.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={status === tab.status}
            onClick={() => {
              setStatus(tab.status);
              setPage(1);
              setComplaints(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${status === tab.status ? 'bg-[var(--primary)] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[var(--primary)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {!complaints ? (
        <Loading />
      ) : complaints.length === 0 ? (
        <Card className="text-center text-slate-500">{status === 'pending' ? 'No hay hojas por responder.' : 'No hay hojas aquí.'}</Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} onChanged={load} />
          ))}
        </div>
      )}

      {(metadata.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-slate-500">
            Página {page} de {metadata.last_page}
          </span>
          <Button variant="secondary" disabled={page >= (metadata.last_page ?? 1)} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function ComplaintCard({ complaint, onChanged }: { complaint: Complaint; onChanged: () => void }) {
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const answer = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/v1/admin/complaints/${complaint.id}/answer`, { method: 'POST', body: { response: response.trim() } });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar la respuesta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={complaint.kind === 'reclamo' ? 'warning' : 'info'}>{complaint.kind === 'reclamo' ? 'Reclamo' : 'Queja'}</Badge>
        <Badge tone={complaint.status === 'answered' ? 'success' : 'neutral'}>{complaint.status === 'answered' ? 'Respondida' : 'Por responder'}</Badge>
        <span className="font-mono text-sm font-semibold text-slate-700">N.º {complaint.number}</span>
        <span className="text-xs text-slate-400">{dateTime(complaint.created_at)}</span>
      </div>

      <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <p className="font-display text-lg font-bold text-slate-900">{complaint.consumer_name}</p>
          <p>
            {complaint.consumer_document_type} {complaint.consumer_document_number}
          </p>
          <p>{complaint.consumer_address}</p>
          <p>
            {complaint.consumer_email}
            {complaint.consumer_phone && ` · ${complaint.consumer_phone}`}
          </p>
          {complaint.guardian_name && <p>Apoderado: {complaint.guardian_name}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{complaint.item_type}</p>
          <p>{complaint.item_description}</p>
          {complaint.amount_cents !== undefined && <p>Monto reclamado: {soles(complaint.amount_cents)}</p>}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Detalle:</strong> <span className="whitespace-pre-line">{complaint.detail}</span>
        </p>
        <p>
          <strong>Pedido:</strong> <span className="whitespace-pre-line">{complaint.request}</span>
        </p>
      </div>

      {complaint.status === 'answered' ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Respuesta enviada {complaint.responded_at && `el ${dateTime(complaint.responded_at)}`}</p>
          <p className="mt-1 whitespace-pre-line">{complaint.response}</p>
        </div>
      ) : (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Respuesta (se envía al consumidor)</span>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={5000}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100"
            />
          </label>
          {error && <Alert tone="error">{error}</Alert>}
          <Button loading={busy} disabled={!response.trim()} onClick={() => window.confirm('¿Enviar esta respuesta? No se puede cambiar después.') && answer()}>
            Enviar respuesta
          </Button>
        </div>
      )}
    </Card>
  );
}
