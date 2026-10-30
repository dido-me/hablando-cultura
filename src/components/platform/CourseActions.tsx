// Tarjeta de compra de la página del curso. Según quién mira muestra: ingresar para
// comprar, activar la cuenta, comprar, pago en revisión o rechazado, o continuar el curso.
// Un enlace con ?cupon=CODIGO abre el pago con ese cupón aplicado.

import { useEffect, useState } from 'react';
import { api, getToken, loadMe, notifyAccountChange } from '../../lib/platform/api';
import { SIGNUP_OPEN } from '../../lib/platform/config';
import { date, duration, soles } from '../../lib/platform/format';
import type { Course, CoursePage, Me, Payment, Viewer } from '../../lib/platform/types';
import Checkout from './Checkout';
import DownloadButton from './DownloadButton';
import { Alert, Button, LinkButton, ProgressBar, Spinner } from './ui';

interface Props {
  course: Course;
  firstLessonSlug?: string;
  // Página del producto, para volver después de ingresar (el ebook vive en /ebook).
  pagePath?: string;
}

export default function CourseActions({ course, firstLessonSlug, pagePath }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [paid, setPaid] = useState<Payment | null>(null);
  const [resent, setResent] = useState(false);
  const [coupon, setCoupon] = useState('');

  const coursePath = `/cursos/${course.slug}`;
  // Al ingresar o registrarse se vuelve a la página con el cupón del enlace.
  const returnPath = (pagePath ?? coursePath) + (coupon ? `?cupon=${encodeURIComponent(coupon)}` : '');
  const isEbook = course.kind === 'ebook';
  const buyLabel = isEbook ? 'Comprar el ebook' : 'Comprar el curso';

  const refresh = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const [account, page] = await Promise.all([loadMe(true), api<CoursePage>(`/v1/courses/${course.slug}`)]);
      setMe(account);
      setViewer(page.viewer ?? null);
    } catch {
      // Sin sesión válida se muestra la tarjeta para visitantes.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCoupon(new URLSearchParams(window.location.search).get('cupon')?.trim().toUpperCase() ?? '');
    refresh();
  }, []);

  // Con un cupón en el enlace, el pago se abre solo en cuanto se sabe quién mira.
  useEffect(() => {
    if (coupon && !loading && me) setBuying(true);
  }, [coupon, loading, me]);

  const presale = course.presale_price_cents && course.presale_until && course.current_price_cents < course.price_cents;
  const startSlug = viewer?.next_lesson_slug ?? firstLessonSlug;

  const onPaid = (payment: Payment) => {
    setPaid(payment);
    setBuying(false);
    refresh();
    // Los materiales del curso, en otra isla de la página, ya se pueden descargar.
    notifyAccountChange();
  };

  const onSubmitted = (payment: Payment) => {
    setBuying(false);
    setViewer((current) => (current ? { ...current, latest_payment: payment } : current));
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-extrabold text-slate-900">{soles(course.current_price_cents)}</span>
        {presale && <span className="text-lg text-slate-400 line-through">{soles(course.price_cents)}</span>}
      </div>
      {presale && <p className="mt-1 text-sm font-semibold text-amber-700">{isEbook ? 'Precio especial' : `Precio de preventa hasta el ${date(course.presale_until!)}`}</p>}

      <ul className="mt-5 space-y-2 text-sm text-slate-600">
        {(isEbook
          ? [
              ['picture_as_pdf', 'Ebook en PDF'],
              ['download', 'Descarga inmediata después del pago'],
              ['all_inclusive', 'Disponible siempre en Mi cuenta'],
            ]
          : [
              ['play_circle', `${course.lesson_count} lecciones en video · ${duration(course.total_duration_seconds)}`],
              ['all_inclusive', 'Acceso sin fecha de vencimiento'],
              ['subtitles', 'Subtítulos en español'],
            ]
        ).map(([icon, text]) => (
          <li key={icon} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[var(--primary)]">{icon}</span>
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-3">
            <Spinner className="h-5 w-5 text-[var(--primary)]" />
          </div>
        ) : !me ? (
          <>
            {coupon && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                <span className="material-symbols-outlined text-lg">sell</span>
                Tu cupón <strong className="font-mono">{coupon}</strong> se aplicará al pagar.
              </p>
            )}
            {SIGNUP_OPEN ? (
              <>
                <LinkButton href={`/registro?next=${encodeURIComponent(returnPath)}`} className="w-full">
                  {buyLabel}
                </LinkButton>
                <p className="text-center text-sm text-slate-500">
                  ¿Ya tienes cuenta?{' '}
                  <a href={`/ingresar?next=${encodeURIComponent(returnPath)}`} className="font-semibold text-[var(--primary)] hover:underline">
                    Ingresa
                  </a>
                </p>
              </>
            ) : (
              <>
                {/* Sin registro abierto, comprar lleva a ingresar: solo entran las cuentas que ya existen. */}
                <LinkButton href={`/ingresar?next=${encodeURIComponent(returnPath)}`} className="w-full">
                  {buyLabel}
                </LinkButton>
                <p className="text-center text-sm text-slate-500">Las inscripciones abren pronto. Si ya tienes cuenta, ingresa para comprar.</p>
              </>
            )}
          </>
        ) : viewer?.enrolled && isEbook ? (
          <>
            {paid && <Alert tone="success">{paid.method === 'coupon' ? '¡Listo! Tu cupón cubrió todo el precio.' : '¡Pago confirmado!'} Ya puedes descargar tu ebook. También queda en Mi cuenta.</Alert>}
            <DownloadButton slug={course.slug} className="w-full" />
          </>
        ) : viewer?.enrolled ? (
          <>
            {paid && (
              <Alert tone="success">
                {paid.method === 'coupon' ? '¡Listo! Tu cupón cubrió todo el precio y ya tienes acceso.' : '¡Pago confirmado! Ya tienes acceso. Te enviamos el comprobante por correo.'}
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Tu avance</span>
                <span>
                  {viewer.completed_lessons} de {course.lesson_count}
                </span>
              </div>
              <ProgressBar value={viewer.completed_lessons} total={course.lesson_count} />
            </div>
            {startSlug && (
              <LinkButton href={`${coursePath}/${startSlug}`} className="w-full">
                {viewer.course_completed ? 'Repasar el curso' : viewer.completed_lessons > 0 ? 'Continuar' : 'Empezar el curso'}
              </LinkButton>
            )}
          </>
        ) : !me.user.activated ? (
          <>
            <Alert tone="warning">Activa tu cuenta para comprar: abre el enlace que enviamos a {me.user.email}.</Alert>
            {resent ? (
              <p className="text-center text-sm text-emerald-700">Te enviamos un nuevo enlace.</p>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => api('/v1/tokens/activation', { method: 'POST', body: { email: me.user.email } }).then(() => setResent(true))}
              >
                Reenviar el correo de activación
              </Button>
            )}
          </>
        ) : viewer?.latest_payment?.status === 'pending' ? (
          <Alert tone="info">
            <strong>Tu pago está en revisión.</strong> Karolay lo confirmará pronto y te avisaremos por correo.
          </Alert>
        ) : buying ? (
          <>
            <Checkout
              courseSlug={course.slug}
              courseTitle={course.title}
              priceCents={course.current_price_cents}
              email={me.user.email}
              initialCoupon={coupon}
              onPaid={onPaid}
              onSubmitted={onSubmitted}
            />
            <Button variant="ghost" className="w-full" onClick={() => setBuying(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            {viewer?.latest_payment?.status === 'rejected' && (
              <Alert tone="error">
                Tu pago anterior fue rechazado{viewer.latest_payment.reject_reason ? `: ${viewer.latest_payment.reject_reason}` : '.'} Puedes intentarlo de nuevo.
              </Alert>
            )}
            <Button className="w-full" onClick={() => setBuying(true)}>
              {buyLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
