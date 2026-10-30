// Panel de pagos para Karolay. Los pagos con Culqi llegan aprobados y no tienen captura.
// Con la aprobación manual encendida (MANUAL_PAYMENTS) también revisa las capturas de
// Yape/Plin y las aprueba o rechaza.

import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { MANUAL_PAYMENTS } from '../../lib/platform/config';
import { dateTime, methodLabels, soles, statusLabels } from '../../lib/platform/format';
import type { AdminPayment, Metadata, PaymentStatus } from '../../lib/platform/types';
import AdminGate from './AdminGate';
import { Alert, Badge, Button, Card, Loading } from './ui';

const tabs: { status: PaymentStatus | ''; label: string }[] = MANUAL_PAYMENTS
  ? [
      { status: 'pending', label: 'Por revisar' },
      { status: 'approved', label: 'Aprobados' },
      { status: 'rejected', label: 'Rechazados' },
      { status: '', label: 'Todos' },
    ]
  : [{ status: '', label: 'Todos' }];

const statusTone = { pending: 'warning', approved: 'success', rejected: 'error' } as const;

export default function AdminPayments() {
  return (
    <AdminGate>
      <Payments />
    </AdminGate>
  );
}

function Payments() {
  const highlight = Number(new URLSearchParams(window.location.search).get('id')) || 0;
  const [status, setStatus] = useState<PaymentStatus | ''>(highlight || !MANUAL_PAYMENTS ? '' : 'pending');
  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({});
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api<{ payments: AdminPayment[]; metadata: Metadata }>(`/v1/admin/payments?status=${status}&page=${page}&page_size=20&sort=-created_at`)
      .then((data) => {
        setPayments(data.payments);
        setMetadata(data.metadata);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los pagos.'));
  };

  useEffect(load, [status, page]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold text-slate-900">Pagos</h1>

      <div className={`flex flex-wrap gap-2 ${tabs.length === 1 ? 'hidden' : ''}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={status === tab.status}
            onClick={() => {
              setStatus(tab.status);
              setPage(1);
              setPayments(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${status === tab.status ? 'bg-[var(--primary)] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[var(--primary)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {!payments ? (
        <Loading />
      ) : payments.length === 0 ? (
        <Card className="text-center text-slate-500">{status === 'pending' ? 'No hay pagos por revisar.' : 'Aún no hay pagos.'}</Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} highlighted={payment.id === highlight} onChanged={load} />
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

function PaymentRow({ payment, highlighted, onChanged }: { payment: AdminPayment; highlighted: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState<'' | 'receipt' | 'approve' | 'reject'>('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isCulqi = payment.method.startsWith('culqi');
  const hasReceipt = payment.method === 'yape' || payment.method === 'plin';

  const act = async (action: 'approve' | 'reject') => {
    setBusy(action);
    setError('');
    try {
      await api(`/v1/admin/payments/${payment.id}/${action}`, { method: 'POST', body: action === 'reject' ? { reason: reason.trim() } : {} });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy('');
    }
  };

  // El enlace a la captura dura 5 minutos; se pide al momento de abrirla.
  const openReceipt = async () => {
    const tab = window.open('', '_blank');
    setBusy('receipt');
    try {
      const data = await api<{ receipt: { url: string } }>(`/v1/admin/payments/${payment.id}/receipt`);
      if (tab) tab.location.href = data.receipt.url;
      else window.location.href = data.receipt.url;
    } catch (err) {
      tab?.close();
      setError(err instanceof ApiError ? err.message : 'No se pudo abrir la captura.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Card className={highlighted ? 'ring-2 ring-[var(--primary)]' : ''}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[payment.status]}>{statusLabels[payment.status]}</Badge>
            <span className="text-xs text-slate-400">{dateTime(payment.created_at)}</span>
          </div>
          <p className="font-display text-lg font-bold text-slate-900">
            {payment.user_name} <span className="text-sm font-normal text-slate-500">· {payment.user_email}</span>
          </p>
          <p className="text-sm text-slate-600">
            {payment.course_title} · <strong>{soles(payment.amount_cents)}</strong> · {methodLabels[payment.method]}
          </p>
          {payment.coupon_code && (
            <p className="flex items-center gap-1 text-xs text-emerald-700">
              <span className="material-symbols-outlined text-sm">sell</span>
              Cupón <span className="font-mono font-semibold">{payment.coupon_code}</span> · descuento de {soles(payment.discount_cents ?? 0)}
            </p>
          )}
          {payment.method !== 'coupon' && (
            <p className="text-xs text-slate-500">
              {isCulqi ? 'ID del cargo en Culqi' : 'N.º de operación'}: <span className="font-mono">{payment.operation_number}</span>
            </p>
          )}
          {payment.reject_reason && <p className="text-sm text-red-600">Motivo: {payment.reject_reason}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {hasReceipt && (
            <Button variant="secondary" loading={busy === 'receipt'} onClick={openReceipt}>
              <span className="material-symbols-outlined text-lg">image</span> Ver captura
            </Button>
          )}
          {payment.status === 'pending' && !rejecting && (
            <>
              <Button loading={busy === 'approve'} onClick={() => window.confirm(`¿Aprobar el pago de ${payment.user_name}? Tendrá acceso al curso.`) && act('approve')}>
                Aprobar
              </Button>
              <Button variant="danger" onClick={() => setRejecting(true)}>
                Rechazar
              </Button>
            </>
          )}
        </div>
      </div>

      {rejecting && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Motivo (se envía al alumno)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100"
              placeholder="Ej.: El número de operación no coincide con la captura."
            />
          </label>
          <div className="flex gap-2">
            <Button variant="danger" loading={busy === 'reject'} disabled={!reason.trim()} onClick={() => act('reject')}>
              Rechazar pago
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}
