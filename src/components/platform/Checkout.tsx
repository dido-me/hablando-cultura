// Compra de un curso. Dos caminos:
// - Tarjeta o Yape con Culqi: acceso inmediato. Culqi Checkout crea un token en el
//   navegador (la tarjeta nunca pasa por nuestros servidores) y la API lo cobra. Si el
//   banco pide 3DS, Culqi3DS autentica la tarjeta y la API reintenta el cobro.
// - Yape o Plin directo, sin comisión: el alumno sube la captura y Karolay lo aprueba.
//   Está apagado por ahora (ver MANUAL_PAYMENTS en config.ts).
// Antes de pagar se puede aplicar un cupón: la API calcula el total, y si el cupón cubre
// todo el precio el producto se obtiene gratis, sin pasar por ningún pago.

import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { CULQI_PUBLIC_KEY, MANUAL_PAYMENTS, YAPE_HOLDER, YAPE_NUMBER } from '../../lib/platform/config';
import { soles } from '../../lib/platform/format';
import type { Payment, Price } from '../../lib/platform/types';
import { Alert, Button, Field, Spinner } from './ui';

const BRAND = '#6d28d9';
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface Parameters3DS {
  eci?: unknown;
  xid?: unknown;
  cavv?: unknown;
  protocolVersion?: unknown;
  directoryServerTransactionId?: unknown;
}

interface CulqiCheckoutInstance {
  culqi: () => void;
  token?: { id: string };
  error?: { user_message?: string; merchant_message?: string };
  open(): void;
  close(): void;
}

declare global {
  interface Window {
    CulqiCheckout?: new (publicKey: string, config: Record<string, unknown>) => CulqiCheckoutInstance;
    Culqi3DS?: {
      publicKey: string;
      settings: Record<string, unknown>;
      options: Record<string, unknown>;
      generateDevice(): Promise<string>;
      initAuthentication(tokenId: string): Promise<void>;
      reset(): void;
    };
  }
}

const scripts = new Map<string, Promise<void>>();

function loadScript(src: string) {
  if (!scripts.has(src)) {
    scripts.set(
      src,
      new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = src;
        tag.async = true;
        tag.onload = () => resolve();
        tag.onerror = () => {
          scripts.delete(src);
          reject(new Error(src));
        };
        document.body.appendChild(tag);
      }),
    );
  }
  return scripts.get(src)!;
}

interface Props {
  courseSlug: string;
  courseTitle: string;
  priceCents: number;
  email: string;
  // Cupón que llegó en el enlace (?cupon=…): se aplica al abrir el pago.
  initialCoupon?: string;
  onPaid: (payment: Payment) => void;
  onSubmitted: (payment: Payment) => void;
}

// PayProps es lo que recibe cada medio de pago: el total ya con el cupón.
type PayProps = Props & { coupon?: string };

export default function Checkout(props: Props) {
  const culqi = Boolean(CULQI_PUBLIC_KEY);
  const [option, setOption] = useState<'culqi' | 'manual'>(culqi ? 'culqi' : 'manual');
  const [price, setPrice] = useState<Price>({ price_cents: props.priceCents, discount_cents: 0, total_cents: props.priceCents });

  if (!culqi && !MANUAL_PAYMENTS) return <Alert tone="warning">Los pagos no están disponibles en este momento. Intenta más tarde.</Alert>;

  const pay: PayProps = { ...props, priceCents: price.total_cents, coupon: price.coupon };
  const reset = () => setPrice({ price_cents: props.priceCents, discount_cents: 0, total_cents: props.priceCents });

  return (
    <div className="space-y-4">
      <CouponBox courseSlug={props.courseSlug} initialCoupon={props.initialCoupon} applied={price.coupon} onApply={setPrice} onRemove={reset} />
      {price.coupon && <PriceSummary price={price} />}

      {price.total_cents === 0 ? (
        <Redeem {...pay} />
      ) : !MANUAL_PAYMENTS ? (
        // Con un solo medio de pago no hace falta elegir.
        <>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span className="material-symbols-outlined text-[var(--primary)]">credit_card</span>
            Paga con tarjeta o Yape y accede al instante.
          </p>
          <CulqiPay {...pay} />
        </>
      ) : (
        <>
          <div className="grid gap-3" role="radiogroup" aria-label="Cómo quieres pagar">
            {culqi && <Option checked={option === 'culqi'} onSelect={() => setOption('culqi')} icon="credit_card" title="Tarjeta o Yape" detail="Acceso inmediato. Visa, Mastercard, Amex, Diners o Yape." />}
            <Option checked={option === 'manual'} onSelect={() => setOption('manual')} icon="qr_code_2" title="Yape o Plin directo" detail="Envías la captura y Karolay aprueba tu acceso en unas horas." />
          </div>
          {option === 'culqi' ? <CulqiPay {...pay} /> : <ManualPay {...pay} />}
        </>
      )}
    </div>
  );
}

interface CouponBoxProps {
  courseSlug: string;
  initialCoupon?: string;
  applied?: string;
  onApply: (price: Price) => void;
  onRemove: () => void;
}

// CouponBox pide el precio a la API con el cupón: así el descuento que se muestra es el
// mismo que se cobra.
function CouponBox({ courseSlug, initialCoupon, applied, onApply, onRemove }: CouponBoxProps) {
  const [open, setOpen] = useState(Boolean(initialCoupon));
  const [code, setCode] = useState(initialCoupon ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apply = async (value: string) => {
    if (!value.trim()) return setError('Escribe el código de tu cupón.');
    setLoading(true);
    setError('');
    try {
      const { price } = await api<{ price: Price }>('/v1/payments/quote', { method: 'POST', body: { course: courseSlug, coupon: value.trim() } });
      onApply(price);
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields.coupon ?? err.message) : 'No pudimos revisar el cupón. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCoupon) apply(initialCoupon);
  }, []);

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">sell</span>
          Cupón <strong className="font-mono">{applied}</strong> aplicado
        </span>
        <button
          type="button"
          className="font-semibold underline hover:text-emerald-700"
          onClick={() => {
            setCode('');
            onRemove();
          }}
        >
          Quitar
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline">
        <span className="material-symbols-outlined text-lg">sell</span>
        ¿Tienes un cupón de descuento?
      </button>
    );
  }

  return (
    <form
      className="space-y-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        apply(code);
      }}
    >
      <div className="flex gap-2">
        <input
          name="coupon"
          aria-label="Código del cupón"
          placeholder="Código del cupón"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-invalid={error ? true : undefined}
          className={`min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-100 ${error ? 'border-red-400' : 'border-slate-200'}`}
        />
        <Button type="submit" variant="secondary" loading={loading} className="py-2.5">
          Aplicar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

function PriceSummary({ price }: { price: Price }) {
  return (
    <dl className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm">
      <div className="flex justify-between text-slate-600">
        <dt>Precio</dt>
        <dd>{soles(price.price_cents)}</dd>
      </div>
      <div className="flex justify-between text-emerald-700">
        <dt>Cupón {price.coupon}</dt>
        <dd>−{soles(price.discount_cents)}</dd>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
        <dt>Total</dt>
        <dd>{price.total_cents === 0 ? 'Gratis' : soles(price.total_cents)}</dd>
      </div>
    </dl>
  );
}

// Redeem: el cupón cubre todo el precio, así que el acceso se pide sin pagar.
function Redeem({ courseSlug, courseTitle, coupon, onPaid }: PayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redeem = async () => {
    setLoading(true);
    setError('');
    try {
      const { payment } = await api<{ payment: Payment }>('/v1/payments/redeem', { method: 'POST', body: { course: courseSlug, coupon } });
      onPaid(payment);
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields.coupon ?? err.message) : 'No pudimos activar tu acceso. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" onClick={redeem} loading={loading} className="w-full">
        <span className="material-symbols-outlined text-lg">redeem</span>
        Obtener gratis
      </Button>
      <p className="text-center text-xs text-slate-500">
        Tu cupón cubre todo el precio de {courseTitle}. Al continuar aceptas los{' '}
        <a href="/terminos" className="underline hover:text-[var(--primary)]">
          Términos y condiciones
        </a>
        .
      </p>
    </div>
  );
}

function Option({ checked, onSelect, icon, title, detail }: { checked: boolean; onSelect: () => void; icon: string; title: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${checked ? 'border-[var(--primary)] bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-300'}`}
    >
      <span className={`material-symbols-outlined mt-0.5 ${checked ? 'text-[var(--primary)]' : 'text-slate-400'}`}>{icon}</span>
      <span>
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
    </button>
  );
}

function CulqiPay({ courseSlug, courseTitle, priceCents, email, coupon, onPaid }: PayProps) {
  const [state, setState] = useState<'idle' | 'opening' | 'charging' | 'authenticating'>('idle');
  const [error, setError] = useState('');

  const fail = (message: string) => {
    setError(message);
    setState('idle');
  };

  const charge = async (tokenId: string, deviceId: string, authentication?: Parameters3DS) => {
    setState('charging');
    try {
      const res = await api<{ payment?: Payment; requires_3ds?: boolean }>('/v1/payments/culqi', {
        method: 'POST',
        body: {
          course: courseSlug,
          token: tokenId,
          coupon,
          // El total que vio el alumno: si cambió, la API no cobra.
          amount_cents: priceCents,
          device_fingerprint_id: deviceId || undefined,
          authentication_3ds: authentication && {
            eci: String(authentication.eci ?? ''),
            xid: String(authentication.xid ?? ''),
            cavv: String(authentication.cavv ?? ''),
            protocolVersion: String(authentication.protocolVersion ?? ''),
            directoryServerTransactionId: String(authentication.directoryServerTransactionId ?? ''),
          },
        },
      });
      if (res.requires_3ds && !authentication) {
        authenticate(tokenId, deviceId);
        return;
      }
      if (res.payment) onPaid(res.payment);
      else fail('El banco no pudo confirmar tu tarjeta. Intenta con otra.');
    } catch (err) {
      fail(err instanceof ApiError ? err.message : 'No se pudo procesar el pago. Intenta de nuevo.');
    }
  };

  // El banco pidió 3DS: Culqi3DS muestra su ventana y devuelve el resultado por postMessage.
  const authenticate = (tokenId: string, deviceId: string) => {
    const culqi3ds = window.Culqi3DS!;
    setState('authenticating');
    culqi3ds.settings = { charge: { totalAmount: priceCents, returnUrl: window.location.href, currency: 'PEN' }, card: { email } };
    culqi3ds.options = { showModal: true, showLoading: true, showIcon: true, style: { btnColor: BRAND, btnTextColor: '#FFFFFF' } };

    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const response = event.data as { parameters3DS?: Parameters3DS; error?: string };
      if (response?.parameters3DS) {
        window.removeEventListener('message', listener);
        charge(tokenId, deviceId, response.parameters3DS);
      } else if (response?.error) {
        window.removeEventListener('message', listener);
        fail(`No se pudo verificar tu tarjeta: ${response.error}`);
      }
    };
    window.addEventListener('message', listener);
    culqi3ds.initAuthentication(tokenId).catch(() => {
      window.removeEventListener('message', listener);
      fail('No se pudo iniciar la verificación de tu tarjeta. Intenta de nuevo.');
    });
  };

  const open = async () => {
    setError('');
    setState('opening');
    try {
      await Promise.all([loadScript('https://js.culqi.com/checkout-js'), loadScript('https://3ds.culqi.com')]);
    } catch {
      fail('No se pudo cargar Culqi. Revisa tu conexión o paga con Yape o Plin directo.');
      return;
    }

    const culqi3ds = window.Culqi3DS!;
    culqi3ds.publicKey = CULQI_PUBLIC_KEY!;
    // El mismo identificador del dispositivo va en el cobro y en su reintento con 3DS.
    const deviceId = await culqi3ds.generateDevice().catch(() => '');

    const checkout = new window.CulqiCheckout!(CULQI_PUBLIC_KEY!, {
      settings: { title: 'Hablando Cultura', currency: 'PEN', amount: priceCents },
      client: { email },
      options: {
        lang: 'auto',
        installments: false,
        modal: true,
        paymentMethods: { tarjeta: true, yape: true, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
        paymentMethodsSort: ['tarjeta', 'yape'],
      },
      appearance: {
        theme: 'default',
        menuType: 'sidebar',
        buttonCardPayText: 'Pagar',
        defaultStyle: { bannerColor: BRAND, buttonBackground: BRAND, menuColor: BRAND, linksColor: BRAND, buttonTextColor: '#FFFFFF', priceColor: BRAND },
      },
    });

    checkout.culqi = () => {
      if (checkout.token) {
        const tokenId = checkout.token.id;
        checkout.close();
        charge(tokenId, deviceId);
      } else if (checkout.error) {
        fail(checkout.error.user_message || checkout.error.merchant_message || 'No se pudo procesar el pago.');
      }
    };

    checkout.open();
    setState('idle');
  };

  const working = state !== 'idle';

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" onClick={open} loading={working} className="w-full">
        {state === 'charging' ? 'Procesando el pago…' : state === 'authenticating' ? 'Verificando tu tarjeta…' : `Pagar ${soles(priceCents)}`}
      </Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500">
        <span className="material-symbols-outlined text-sm">lock</span>
        Pago seguro con Culqi · {courseTitle}
      </p>
      <p className="text-center text-xs text-slate-500">
        Al pagar aceptas los{' '}
        <a href="/terminos" className="underline hover:text-[var(--primary)]">
          Términos y condiciones
        </a>
        .
      </p>
    </div>
  );
}

function ManualPay({ courseSlug, priceCents, coupon, onSubmitted }: PayProps) {
  const [method, setMethod] = useState<'yape' | 'plin'>('yape');
  const [operation, setOperation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFields({});

    if (!file) return setFields({ receipt: 'Sube la captura de tu pago.' });
    if (!RECEIPT_TYPES.includes(file.type)) return setFields({ receipt: 'Sube una imagen (JPG, PNG o WebP) o un PDF.' });
    if (file.size > MAX_RECEIPT_BYTES) return setFields({ receipt: 'El archivo debe pesar como máximo 5 MB.' });

    setLoading(true);
    try {
      const { upload } = await api<{ upload: { key: string; url: string; method: string; headers: Record<string, string> } }>('/v1/payments/receipt-upload', {
        method: 'POST',
        body: { content_type: file.type, size: file.size },
      });

      // La captura va directo al almacenamiento privado con un enlace firmado.
      const put = await fetch(upload.url, { method: upload.method, headers: upload.headers, body: file }).catch(() => null);
      if (!put?.ok) throw new ApiError(0, 'No se pudo subir la captura. Intenta de nuevo.');

      const { payment } = await api<{ payment: Payment }>('/v1/payments', {
        method: 'POST',
        body: { course: courseSlug, method, operation_number: operation.trim(), receipt_key: upload.key, coupon },
      });
      onSubmitted(payment);
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setError(err.message);
      } else {
        setError('No se pudo enviar tu pago. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <ol className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <li>
          <strong>1.</strong> Yapea o plinea <strong>{soles(priceCents)}</strong> a{' '}
          {YAPE_NUMBER ? (
            <>
              <strong className="whitespace-nowrap text-[var(--primary)]">{YAPE_NUMBER}</strong> ({YAPE_HOLDER}).
            </>
          ) : (
            <>{YAPE_HOLDER}.</>
          )}
        </li>
        <li>
          <strong>2.</strong> Toma una captura donde se vea el número de operación.
        </li>
        <li>
          <strong>3.</strong> Envíala aquí. Te avisamos por correo cuando tengas acceso.
        </li>
      </ol>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex gap-2" role="radiogroup" aria-label="Medio de pago">
        {(['yape', 'plin'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={method === value}
            onClick={() => setMethod(value)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition ${method === value ? 'border-[var(--primary)] bg-violet-50 text-[var(--primary)]' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}
          >
            {value}
          </button>
        ))}
      </div>

      <Field
        label="Número de operación"
        name="operation_number"
        inputMode="text"
        required
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        error={fields.operation_number}
        hint="Está en el detalle del pago en tu app."
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Captura del pago</span>
        <input
          type="file"
          name="receipt"
          accept={RECEIPT_TYPES.join(',')}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--primary)] hover:file:bg-violet-100"
        />
        {(fields.receipt || fields.receipt_key) && <span className="mt-1 block text-xs text-red-600">{fields.receipt || fields.receipt_key}</span>}
      </label>

      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Enviando…' : 'Ya pagué, enviar captura'}
      </Button>
      {loading && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Spinner className="h-3 w-3" /> Subiendo tu captura de forma segura
        </p>
      )}
    </form>
  );
}
