// Formatos en español de Perú para precios, duraciones y fechas.

import type { Payment } from './types';

export function soles(cents: number) {
  return `S/ ${(cents / 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// duration da "39 min" o "3 h 25 min".
export function duration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const dateFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima' });
const dateTimeFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

export const date = (iso: string) => dateFormat.format(new Date(iso));
export const dateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

export const methodLabels: Record<Payment['method'], string> = {
  yape: 'Yape (captura)',
  plin: 'Plin (captura)',
  culqi_card: 'Tarjeta (Culqi)',
  culqi_yape: 'Yape (Culqi)',
};

export const statusLabels: Record<Payment['status'], string> = {
  pending: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};
