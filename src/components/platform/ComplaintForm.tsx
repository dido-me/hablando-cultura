// Hoja del Libro de Reclamaciones virtual. Sigue los apartados de la hoja de reclamación
// del reglamento (consumidor, bien contratado, detalle y pedido) y queda guardada en la
// web, sin formularios externos, como exige Culqi.

import { useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { Alert, Button, Card, Field } from './ui';

type Kind = 'reclamo' | 'queja';
type ItemType = 'servicio' | 'producto';

const fieldMessages: Record<string, string> = {
  'must be provided': 'Este campo es obligatorio.',
  'must be 6 to 20 letters, digits or hyphens': 'Escribe un número de documento válido.',
};

export default function ComplaintForm() {
  const [kind, setKind] = useState<Kind>('reclamo');
  const [itemType, setItemType] = useState<ItemType>('servicio');
  const [minor, setMinor] = useState(false);
  const [form, setForm] = useState({
    consumer_name: '',
    consumer_document_type: 'DNI',
    consumer_document_number: '',
    consumer_address: '',
    consumer_phone: '',
    consumer_email: '',
    guardian_name: '',
    item_description: '',
    amount: '',
    detail: '',
    request: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [filed, setFiled] = useState<{ number: string; email: string } | null>(null);

  const set = (name: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [name]: event.target.value });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFields({});
    if (!accepted) return setError('Confirma que los datos son verdaderos para registrar la hoja.');

    const amount = form.amount.trim() ? Math.round(Number(form.amount.replace(',', '.')) * 100) : undefined;
    if (amount !== undefined && (Number.isNaN(amount) || amount < 0)) return setFields({ amount: 'Escribe un monto válido, por ejemplo 35.00.' });

    setLoading(true);
    try {
      const { complaint } = await api<{ complaint: { number: string } }>('/v1/complaints', {
        method: 'POST',
        body: {
          kind,
          consumer_name: form.consumer_name,
          consumer_document_type: form.consumer_document_type,
          consumer_document_number: form.consumer_document_number,
          consumer_address: form.consumer_address,
          consumer_phone: form.consumer_phone,
          consumer_email: form.consumer_email,
          guardian_name: minor ? form.guardian_name : '',
          item_type: itemType,
          item_description: form.item_description,
          amount_cents: amount,
          detail: form.detail,
          request: form.request,
        },
      });
      setFiled({ number: complaint.number, email: form.consumer_email.trim() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setFields(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, fieldMessages[v] ?? v])));
        setError('Revisa los campos marcados.');
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos registrar tu hoja. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (filed) {
    return (
      <Card className="space-y-4">
        <Alert tone="success">
          <p className="text-base font-semibold">Registramos tu {kind} con el N.º {filed.number}.</p>
          <p className="mt-1">Te enviamos una copia de la hoja a {filed.email}.</p>
        </Alert>
        <p className="text-sm text-slate-600">Te responderemos por correo en un plazo máximo de 15 días hábiles.</p>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}

      <Section title="1. Identificación del consumidor">
        <Field label="Nombre completo" value={form.consumer_name} onChange={set('consumer_name')} error={fields.consumer_name} required autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Documento</span>
            <select
              value={form.consumer_document_type}
              onChange={set('consumer_document_type')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
            >
              {['DNI', 'CE', 'Pasaporte', 'RUC'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <Field label="Número de documento" value={form.consumer_document_number} onChange={set('consumer_document_number')} error={fields.consumer_document_number} required />
        </div>
        <Field label="Domicilio" value={form.consumer_address} onChange={set('consumer_address')} error={fields.consumer_address} required autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo" type="email" value={form.consumer_email} onChange={set('consumer_email')} error={fields.consumer_email} required autoComplete="email" />
          <Field label="Teléfono (opcional)" type="tel" value={form.consumer_phone} onChange={set('consumer_phone')} error={fields.consumer_phone} autoComplete="tel" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={minor} onChange={(e) => setMinor(e.target.checked)} className="rounded text-[var(--primary)]" />
          Soy menor de edad
        </label>
        {minor && <Field label="Nombre del padre, madre o apoderado" value={form.guardian_name} onChange={set('guardian_name')} error={fields.guardian_name} required />}
      </Section>

      <Section title="2. Identificación del bien contratado">
        <Choice
          name="item_type"
          value={itemType}
          onChange={(v) => setItemType(v as ItemType)}
          options={[
            ['servicio', 'Servicio', 'Por ejemplo, un curso en línea.'],
            ['producto', 'Producto', 'Por ejemplo, el ebook.'],
          ]}
        />
        <Field label="Descripción" value={form.item_description} onChange={set('item_description')} error={fields.item_description} required placeholder="Ej.: Curso Haz realidad tu proyecto cultural" />
        <Field label="Monto reclamado en soles (opcional)" inputMode="decimal" value={form.amount} onChange={set('amount')} error={fields.amount || fields.amount_cents} placeholder="35.00" />
      </Section>

      <Section title="3. Detalle de la reclamación y pedido del consumidor">
        <Choice
          name="kind"
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            ['reclamo', 'Reclamo', 'Disconformidad relacionada a los productos o servicios.'],
            ['queja', 'Queja', 'Disconformidad no relacionada a los productos o servicios, o malestar o descontento respecto a la atención al público.'],
          ]}
        />
        <TextArea label="Detalle" value={form.detail} onChange={set('detail')} error={fields.detail} rows={5} />
        <TextArea label="Pedido" value={form.request} onChange={set('request')} error={fields.request} rows={3} hint="Qué solución esperas." />
      </Section>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 rounded text-[var(--primary)]" />
        <span>
          Declaro que los datos consignados son verdaderos y acepto que se usen para atender esta hoja, según la{' '}
          <a href="/privacidad" className="font-semibold text-[var(--primary)] underline">
            Política de privacidad
          </a>
          .
        </span>
      </label>

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        Enviar hoja de reclamación
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </Card>
  );
}

function Choice({ name, value, onChange, options }: { name: string; value: string; onChange: (value: string) => void; options: [string, string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map(([v, label, detail]) => (
        <label
          key={v}
          className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm transition ${value === v ? 'border-[var(--primary)] bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}
        >
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="mt-0.5 text-[var(--primary)]" />
          <span>
            <span className="block font-semibold text-slate-900">{label}</span>
            <span className="block text-xs text-slate-500">{detail}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function TextArea({ label, value, onChange, error, rows, hint }: { label: string; value: string; onChange: (e: { target: { value: string } }) => void; error?: string; rows: number; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={3000}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100 ${error ? 'border-red-400' : 'border-slate-200'}`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
