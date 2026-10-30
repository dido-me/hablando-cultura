// Formatos en español de Perú para precios, duraciones y fechas.

import type { Payment } from './types';

// soles da "S/ 35.00". Los espacios de soles y duration son no separables (\u00a0) para que
// el precio o la duración no se partan en dos líneas.
export function soles(cents: number) {
  return `S/\u00a0${(cents / 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// duration da "39 min" o "3 h 25 min".
export function duration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}\u00a0min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}\u00a0h\u00a0${rest}\u00a0min` : `${hours}\u00a0h`;
}

const dateFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima' });
const dateTimeFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

export const date = (iso: string) => dateFormat.format(new Date(iso));
export const dateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

// discountLabel da "20 %" o "S/ 10.00", según el tipo de cupón.
export function discountLabel(kind: 'percent' | 'amount', value: number) {
  return kind === 'percent' ? `${value} %` : soles(value);
}

// fileFormat da el nombre y el ícono de un archivo según su extensión.
export function fileFormat(format: string) {
  switch (format) {
    case 'pdf':
      return { label: 'PDF', icon: 'picture_as_pdf' };
    case 'doc':
    case 'docx':
      return { label: 'Word', icon: 'description' };
    case 'xls':
    case 'xlsx':
      return { label: 'Excel', icon: 'table_chart' };
    case 'ppt':
    case 'pptx':
      return { label: 'PowerPoint', icon: 'slideshow' };
    default:
      return { label: format.toUpperCase(), icon: 'draft' };
  }
}

export const methodLabels: Record<Payment['method'], string> = {
  yape: 'Yape (captura)',
  plin: 'Plin (captura)',
  culqi_card: 'Tarjeta (Culqi)',
  culqi_yape: 'Yape (Culqi)',
  coupon: 'Cupón (gratis)',
};

export const statusLabels: Record<Payment['status'], string> = {
  pending: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};
