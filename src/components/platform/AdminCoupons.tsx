// Panel de cupones para Karolay: crea cupones de porcentaje o monto fijo para los
// productos que elija, con fechas y límite de usos opcionales, y los activa, desactiva o
// borra (solo si nadie los usó). Un cupón del 100 % da el producto gratis.

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { date, discountLabel, soles } from '../../lib/platform/format';
import type { Coupon, Course } from '../../lib/platform/types';
import AdminGate from './AdminGate';
import { Alert, Badge, Button, Card, Field, Loading } from './ui';

const DAY_MS = 24 * 60 * 60 * 1000;

// Las fechas se eligen por día, en hora de Lima (UTC−5, sin horario de verano).
const limaDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const limaDay = (instant: number | string) => limaDayFormat.format(new Date(instant));
const startOfDay = (day: string) => new Date(`${day}T00:00:00-05:00`).getTime();

export default function AdminCoupons() {
  return (
    <AdminGate>
      <Coupons />
    </AdminGate>
  );
}

function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [products, setProducts] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api<{ coupons: Coupon[] }>('/v1/admin/coupons'), api<{ courses: Course[] }>('/v1/courses')])
      .then(([data, catalog]) => {
        setCoupons(data.coupons);
        setProducts(catalog.courses);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los cupones.'));
  };

  useEffect(load, []);

  const saved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-slate-900">Cupones</h1>
          <p className="mt-1 text-slate-500">Descuentos que tus alumnos aplican al comprar. Con 100 % el producto es gratis.</p>
        </div>
        {editing === null && (
          <Button onClick={() => setEditing('new')}>
            <span className="material-symbols-outlined text-lg">add</span> Nuevo cupón
          </Button>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {editing !== null && <CouponForm coupon={editing === 'new' ? null : editing} products={products} onSaved={saved} onCancel={() => setEditing(null)} />}

      {!coupons ? (
        <Loading />
      ) : coupons.length === 0 ? (
        editing === null && <Card className="text-center text-slate-500">Aún no hay cupones. Crea el primero con «Nuevo cupón».</Card>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} products={products} onEdit={() => setEditing(coupon)} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

// status dice si el cupón sirve hoy, y si no, por qué.
function status(coupon: Coupon): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  const now = Date.now();
  if (!coupon.active) return { label: 'Desactivado', tone: 'neutral' };
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() <= now) return { label: 'Vencido', tone: 'neutral' };
  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses) return { label: 'Agotado', tone: 'neutral' };
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return { label: 'Programado', tone: 'warning' };
  return { label: 'Activo', tone: 'success' };
}

function validity(coupon: Coupon) {
  // ends_at es el primer momento en que ya no sirve: el último día es el anterior.
  const last = coupon.ends_at && date(new Date(new Date(coupon.ends_at).getTime() - 1000).toISOString());
  if (coupon.starts_at && last) return `Del ${date(coupon.starts_at)} al ${last}`;
  if (coupon.starts_at) return `Desde el ${date(coupon.starts_at)}`;
  if (last) return `Hasta el ${last}`;
  return 'Sin fecha de fin';
}

// productPath es la página de venta de un producto, para compartir el enlace con el cupón.
const productPath = (product: Course) => (product.kind === 'ebook' ? '/ebook' : `/cursos/${product.slug}`);

function CouponRow({ coupon, products, onEdit, onChanged }: { coupon: Coupon; products: Course[]; onEdit: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState<'' | 'toggle' | 'delete'>('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const state = status(coupon);
  const applies = coupon.all_courses ? products : products.filter((p) => coupon.course_ids.includes(p.id));

  const toggle = async () => {
    setBusy('toggle');
    setError('');
    try {
      await api(`/v1/admin/coupons/${coupon.id}`, { method: 'PUT', body: { ...couponBody(coupon), active: !coupon.active, version: coupon.version } });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!window.confirm(`¿Borrar el cupón ${coupon.code}?`)) return;
    setBusy('delete');
    setError('');
    try {
      await api(`/v1/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo borrar.');
      setBusy('');
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      window.prompt('Copia el texto:', text);
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xl font-bold text-slate-900">{coupon.code}</span>
            <Badge tone={state.tone}>{state.label}</Badge>
            <span className="rounded-full bg-violet-50 px-3 py-0.5 text-sm font-bold text-[var(--primary)]">
              {coupon.kind === 'percent' && coupon.value === 100 ? 'Gratis' : `−${discountLabel(coupon.kind, coupon.value)}`}
            </span>
          </div>
          <p className="text-sm text-slate-600">{coupon.all_courses ? 'Todos los productos' : applies.map((p) => p.title).join(' · ') || 'Productos no publicados'}</p>
          <p className="text-sm text-slate-500">
            {validity(coupon)} · {coupon.max_uses !== null ? `${coupon.uses} de ${coupon.max_uses} usos` : `${coupon.uses} ${coupon.uses === 1 ? 'uso' : 'usos'}`}
          </p>
          {coupon.note && <p className="text-sm italic text-slate-500">{coupon.note}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => copy(coupon.code, 'code')}>
            <span className="material-symbols-outlined text-lg">content_copy</span> {copied === 'code' ? 'Copiado' : 'Código'}
          </Button>
          {applies.length === 1 && (
            <Button variant="secondary" onClick={() => copy(`${window.location.origin}${productPath(applies[0])}?cupon=${coupon.code}`, 'link')}>
              <span className="material-symbols-outlined text-lg">link</span> {copied === 'link' ? 'Copiado' : 'Enlace'}
            </Button>
          )}
          <Button variant="secondary" onClick={onEdit}>
            <span className="material-symbols-outlined text-lg">edit</span> Editar
          </Button>
          <Button variant="ghost" loading={busy === 'toggle'} onClick={toggle}>
            {coupon.active ? 'Desactivar' : 'Activar'}
          </Button>
          {coupon.uses === 0 && (
            <Button variant="danger" loading={busy === 'delete'} onClick={remove}>
              Borrar
            </Button>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

// couponBody es lo que la API acepta al guardar, sin los campos que calcula ella.
function couponBody(c: Coupon) {
  return {
    code: c.code,
    kind: c.kind,
    value: c.value,
    all_courses: c.all_courses,
    course_ids: c.course_ids,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    max_uses: c.max_uses,
    active: c.active,
    note: c.note,
  };
}

interface FormState {
  code: string;
  kind: 'percent' | 'amount';
  value: string;
  allCourses: boolean;
  courseIds: number[];
  startDay: string;
  endDay: string;
  maxUses: string;
  active: boolean;
  note: string;
}

function toForm(coupon: Coupon | null): FormState {
  if (!coupon) {
    return { code: '', kind: 'percent', value: '', allCourses: false, courseIds: [], startDay: '', endDay: '', maxUses: '', active: true, note: '' };
  }
  return {
    code: coupon.code,
    kind: coupon.kind,
    value: coupon.kind === 'percent' ? String(coupon.value) : (coupon.value / 100).toFixed(2),
    allCourses: coupon.all_courses,
    courseIds: coupon.course_ids,
    startDay: coupon.starts_at ? limaDay(coupon.starts_at) : '',
    endDay: coupon.ends_at ? limaDay(new Date(coupon.ends_at).getTime() - 1000) : '',
    maxUses: coupon.max_uses === null ? '' : String(coupon.max_uses),
    active: coupon.active,
    note: coupon.note,
  };
}

function CouponForm({ coupon, products, onSaved, onCancel }: { coupon: Coupon | null; products: Course[]; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(() => toForm(coupon));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const toggleProduct = (id: number) => set('courseIds', form.courseIds.includes(id) ? form.courseIds.filter((c) => c !== id) : [...form.courseIds, id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFields({});

    const number = Number(form.value.replace(',', '.'));
    const body = {
      code: form.code.trim(),
      kind: form.kind,
      value: form.kind === 'percent' ? Math.round(number) : Math.round(number * 100),
      all_courses: form.allCourses,
      course_ids: form.allCourses ? [] : form.courseIds,
      starts_at: form.startDay ? new Date(startOfDay(form.startDay)).toISOString() : null,
      // Vale todo el último día: deja de servir al empezar el siguiente.
      ends_at: form.endDay ? new Date(startOfDay(form.endDay) + DAY_MS).toISOString() : null,
      max_uses: form.maxUses.trim() ? Math.round(Number(form.maxUses)) : null,
      active: form.active,
      note: form.note.trim(),
    };

    setSaving(true);
    try {
      if (coupon) await api(`/v1/admin/coupons/${coupon.id}`, { method: 'PUT', body: { ...body, version: coupon.version } });
      else await api('/v1/admin/coupons', { method: 'POST', body });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setError(err.message);
      } else {
        setError('No se pudo guardar el cupón.');
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = (() => {
    const number = Number(form.value.replace(',', '.'));
    if (!number || number <= 0) return '';
    return form.kind === 'percent' ? (number >= 100 ? 'El producto queda gratis.' : `${Math.round(number)} % menos sobre el precio vigente (preventa incluida).`) : `${soles(Math.round(number * 100))} menos sobre el precio vigente.`;
  })();

  return (
    <Card className="ring-2 ring-violet-100">
      <form className="space-y-6" onSubmit={submit} noValidate>
        <h2 className="font-display text-2xl font-bold text-slate-900">{coupon ? `Editar ${coupon.code}` : 'Nuevo cupón'}</h2>
        {error && <Alert tone="error">{error}</Alert>}
        {coupon && coupon.uses > 0 && <Alert tone="info">Este cupón ya se usó {coupon.uses} {coupon.uses === 1 ? 'vez' : 'veces'}. Los cambios valen para las próximas compras; las anteriores no cambian.</Alert>}

        <Field
          label="Código"
          name="code"
          autoComplete="off"
          value={form.code}
          onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s+/g, '-'))}
          error={fields.code}
          hint="Letras, números y guiones, de 3 a 30. Ej.: KAROLAY20 o BECA-2026."
        />

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Descuento</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex gap-2" role="radiogroup" aria-label="Tipo de descuento">
              {(
                [
                  ['percent', 'Porcentaje'],
                  ['amount', 'Monto fijo'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === kind}
                  onClick={() => set('kind', kind)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${form.kind === kind ? 'border-[var(--primary)] bg-violet-50 text-[var(--primary)]' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-48">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-500">{form.kind === 'percent' ? '%' : 'S/'}</span>
              <input
                name="value"
                inputMode="decimal"
                aria-label={form.kind === 'percent' ? 'Porcentaje de descuento' : 'Monto de descuento en soles'}
                placeholder={form.kind === 'percent' ? '20' : '10.00'}
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                aria-invalid={fields.value ? true : undefined}
                className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100 ${fields.value ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
          </div>
          {fields.value || fields.kind ? <span className="mt-1 block text-xs text-red-600">{fields.value || fields.kind}</span> : preview && <span className="mt-1 block text-xs text-slate-500">{preview}</span>}
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-slate-700">Productos</legend>
          <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
            <Check checked={form.allCourses} onChange={(checked) => set('allCourses', checked)}>
              <strong>Todos los productos</strong>, también los que publiques después
            </Check>
            {!form.allCourses &&
              products.map((product) => (
                <Check key={product.id} checked={form.courseIds.includes(product.id)} onChange={() => toggleProduct(product.id)}>
                  {product.title} <span className="text-slate-400">· {product.kind === 'ebook' ? 'Ebook' : 'Curso'} · {soles(product.current_price_cents)}</span>
                </Check>
              ))}
          </div>
          {fields.course_ids && <span className="mt-1 block text-xs text-red-600">{fields.course_ids}</span>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Válido desde (opcional)" name="starts_at" type="date" value={form.startDay} onChange={(e) => set('startDay', e.target.value)} error={fields.starts_at} />
          <Field label="Válido hasta (opcional)" name="ends_at" type="date" value={form.endDay} onChange={(e) => set('endDay', e.target.value)} error={fields.ends_at} hint="Incluye ese día completo." />
          <Field
            label="Límite de usos (opcional)"
            name="max_uses"
            inputMode="numeric"
            placeholder="Sin límite"
            value={form.maxUses}
            onChange={(e) => set('maxUses', e.target.value.replace(/\D/g, ''))}
            error={fields.max_uses}
          />
        </div>

        <Field label="Nota interna (opcional)" name="note" maxLength={500} placeholder="Ej.: colaboración con @fulana" value={form.note} onChange={(e) => set('note', e.target.value)} error={fields.note} />

        <Check checked={form.active} onChange={(checked) => set('active', checked)}>
          Activo: tus alumnos ya pueden usarlo
        </Check>

        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            Guardar cupón
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
      <span>{children}</span>
    </label>
  );
}
